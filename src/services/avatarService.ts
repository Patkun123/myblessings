import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { updateUserAvatar } from '@/db/queries/profile';

const AVATARS_FOLDER = 'avatars';

function extensionFromUri(uri: string): string {
  const clean = uri.split('?')[0] ?? '';
  const match = /\.(png|jpe?g|webp|gif|heic|heif)$/i.exec(clean);
  return match ? `.${match[1]!.toLowerCase()}` : '.jpg';
}

/** Deletes a previously saved local avatar file, ignoring missing or external URIs. */
export function deleteLocalAvatarFile(uri: string | null | undefined): void {
  if (!uri || Platform.OS === 'web') return;
  try {
    if (!uri.startsWith(Paths.document.uri)) return;
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Non-fatal cleanup failure; the database reference is already updated.
  }
}

/**
 * Prompts the user to choose an image from their photo library and returns a
 * persistent URI (data URI on web, app-documents file URI on native), or `null`
 * if cancelled.
 */
export async function pickAndSaveAvatar(userId: string): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Allow photo library access in your device settings to upload a photo.');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
    base64: Platform.OS === 'web',
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];

  if (Platform.OS === 'web') {
    if (asset.base64) {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      return `data:${mimeType};base64,${asset.base64}`;
    }
    return asset.uri;
  }

  const avatarsDir = new Directory(Paths.document, AVATARS_FOLDER);
  avatarsDir.create({ intermediates: true, idempotent: true });

  const destination = new File(avatarsDir, `${userId}-${Date.now()}${extensionFromUri(asset.uri)}`);
  const source = new File(asset.uri);
  await source.copy(destination, { overwrite: true });

  return destination.uri;
}

/** Picks, persists, and saves a new avatar URI for the user; returns whether it changed. */
export async function uploadProfileAvatar(
  userId: string,
  previousUri?: string | null
): Promise<boolean> {
  const nextUri = await pickAndSaveAvatar(userId);
  if (!nextUri) return false;

  await updateUserAvatar(userId, nextUri);
  if (previousUri && previousUri !== nextUri) {
    deleteLocalAvatarFile(previousUri);
  }
  return true;
}

/** Clears the profile avatar in SQLite and deletes any local copy. */
export async function removeProfileAvatar(
  userId: string,
  previousUri?: string | null
): Promise<void> {
  await updateUserAvatar(userId, null);
  deleteLocalAvatarFile(previousUri);
}
