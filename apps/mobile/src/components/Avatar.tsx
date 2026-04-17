import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
}

export default function Avatar({ url, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const fontSize = size * 0.38;
  const borderRadius = size / 2;

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius }}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius }}
      className="bg-primary/15 items-center justify-center"
    >
      <Text style={{ fontSize }} className="text-primary font-body-bold">
        {initials}
      </Text>
    </View>
  );
}
