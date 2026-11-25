import { Platform } from 'react-native';

import { removeProfileAvatar, uploadProfileAvatar } from '@/services/avatarService';

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockUpdateUserAvatar = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
const mockCreateDir = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermissionsAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

jest.mock('expo-file-system', () => {
  class MockDirectory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    create = mockCreateDir;
  }

  class MockFile {
    uri: string;
    exists = true;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    copy = mockCopy;
    delete = mockDelete;
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: {
      document: { uri: 'file:///documents' },
    },
  };
});

jest.mock('@/db/queries/profile', () => ({
  updateUserAvatar: (...args: unknown[]) => mockUpdateUserAvatar(...args),
}));

describe('avatarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = 'ios';
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockCopy.mockResolvedValue(undefined);
    mockUpdateUserAvatar.mockResolvedValue(undefined);
  });

  it('returns false when user cancels photo selection', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });

    await expect(uploadProfileAvatar('user-1')).resolves.toBe(false);
    expect(mockUpdateUserAvatar).not.toHaveBeenCalled();
  });

  it('throws when photo library permission is denied on native', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(uploadProfileAvatar('user-1')).rejects.toThrow(/Allow photo library access/);
    expect(mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('copies the picked image on native, saves it, and deletes previous local file', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/picked.png' }],
    });

    const changed = await uploadProfileAvatar('user-1', 'file:///documents/avatars/old.jpg');

    expect(changed).toBe(true);
    expect(mockCreateDir).toHaveBeenCalledWith({ intermediates: true, idempotent: true });
    expect(mockCopy).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserAvatar).toHaveBeenCalledWith(
      'user-1',
      expect.stringMatching(/^file:\/\/\/documents\/avatars\/user-1-\d+\.png$/)
    );
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('stores a base64 data URI on web', async () => {
    (Platform as { OS: string }).OS = 'web';
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:http://localhost/123', base64: 'YWJj', mimeType: 'image/png' }],
    });

    const changed = await uploadProfileAvatar('user-1');

    expect(changed).toBe(true);
    expect(mockRequestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    expect(mockUpdateUserAvatar).toHaveBeenCalledWith('user-1', 'data:image/png;base64,YWJj');
  });

  it('clears avatar URI and deletes local file on remove', async () => {
    await removeProfileAvatar('user-1', 'file:///documents/avatars/old.jpg');

    expect(mockUpdateUserAvatar).toHaveBeenCalledWith('user-1', null);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
