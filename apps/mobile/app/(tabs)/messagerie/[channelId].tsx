import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChannelScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading } = trpc.message.list.useQuery({
    channelId: channelId!,
  });

  const utils = trpc.useUtils();

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.message.list.invalidate({ channelId: channelId! });
    },
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMutation.mutate({
      channelId: channelId!,
      content: newMessage.trim(),
    });
  };

  const messages: Message[] = data ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ title: "..." }} />
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: "Canal" }} />

      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View className="flex-row mb-4">
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
              <Text className="text-sm font-semibold text-gray-600">
                {getInitials(item.author.firstName, item.author.lastName)}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-baseline mb-1">
                <Text className="font-semibold text-sm mr-2">
                  {item.author.firstName} {item.author.lastName}
                </Text>
                <Text className="text-xs text-gray-400">
                  {formatTime(item.createdAt)}
                </Text>
              </View>
              <Text className="text-base text-gray-800">
                {item.content}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">
              Aucun message pour le moment
            </Text>
          </View>
        }
      />

      <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
        <TextInput
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-base mr-3"
          placeholder="Écrire un message..."
          placeholderTextColor="#9CA3AF"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={2000}
        />
        <Pressable
          onPress={handleSend}
          disabled={!newMessage.trim() || sendMutation.isPending}
          className="bg-black rounded-full w-10 h-10 items-center justify-center"
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
