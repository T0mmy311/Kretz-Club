import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

interface Investment {
  id: string;
  title: string;
  location: string;
  status: string;
  progress: number;
  deckUrl?: string;
}

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "ouvert":
      return "bg-green-100 text-green-800";
    case "en cours":
      return "bg-blue-100 text-blue-800";
    case "clôturé":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function InvestissementsScreen() {
  const { data, isLoading, error } = trpc.investment.list.useQuery();

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
          Impossible de charger les investissements. Veuillez réessayer.
        </Text>
      </View>
    );
  }

  const investments: Investment[] = data ?? [];

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={investments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-lg font-semibold flex-1 mr-2">
                {item.title}
              </Text>
              <View
                className={`rounded-full px-3 py-1 ${statusColor(item.status).split(" ")[0]}`}
              >
                <Text
                  className={`text-xs font-medium ${statusColor(item.status).split(" ")[1]}`}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-1">
                {item.location}
              </Text>
            </View>

            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Progression</Text>
                <Text className="text-xs font-medium">
                  {Math.round(item.progress * 100)}%
                </Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-black rounded-full"
                  style={{ width: `${item.progress * 100}%` }}
                />
              </View>
            </View>

            {item.deckUrl && (
              <Pressable className="flex-row items-center justify-center border border-gray-300 rounded-lg py-2.5">
                <Ionicons name="document-outline" size={16} color="#000" />
                <Text className="ml-2 font-medium text-sm">
                  Voir le deck
                </Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">
              Aucun investissement disponible
            </Text>
          </View>
        }
      />
    </View>
  );
}
