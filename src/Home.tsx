import { useState } from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen() {
  const [showUI, setShowUI] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Button
        title={showUI ? 'Ẩn UI' : 'Hiện UI'}
        onPress={() => setShowUI(!showUI)}
      />

      {showUI && (
        <View
          style={{
            marginTop: 20,
            padding: 20,
            backgroundColor: '#ddd',
            borderRadius: 10,
          }}
        >
          <Text>UI đang hiện</Text>
        </View>
      )}
    </View>
  );
}