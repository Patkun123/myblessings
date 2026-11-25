import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/** Type-safe Ionicons name, e.g. for values coming out of the database. */
export type IconName = ComponentProps<typeof Ionicons>['name'];
