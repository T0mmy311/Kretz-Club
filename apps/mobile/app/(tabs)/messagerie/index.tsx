import { View, Text, Pressable, SectionList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

interface Channel {
  id: string;
  name: string;
  unreadCount?: number;
}

interface ChannelSection {
  title: string;
  data: Channel[];
}

export default function MessagerieScreen() {
  const router = useRouter();
  const { data, isLoading, error } = trpc.channel.list.useQuery();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-gray-500 text-center">
          Impossible de charger les canaux. Veuillez réessayer.
        </Text>
      </View>
    );
  }

  const sections: ChannelSection[] = data ?? [];

  return (
    <View className="flex-1 bg-white">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View className="bg-gray-50 px-4 py-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/messagerie/${item.id}`)}
            className="flex-row items-center px-4 py-3 border-b border-gray-100"
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color="#6B7280"
            />
            <Text className="flex-1 ml-3 text-base">{item.name}</Text>
            {item.unreadCount && item.unreadCount > 0 ? (
              <View className="bg-black rounded-full px-2 py-0.5 min-w-[24px] items-center">
                <Text className="text-white text-xs font-semibold">
                  {item.unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-base">Aucun canal disponible</Text>
          </View>
        }
      />
    </View>
  );
}
