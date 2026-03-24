import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number | null;
  isPast: boolean;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EvenementsScreen() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const { data, isLoading, error } = trpc.event.list.useQuery();

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
          Impossible de charger les événements. Veuillez réessayer.
        </Text>
      </View>
    );
  }

  const allEvents: Event[] = data ?? [];
  const events = allEvents.filter((e) =>
    tab === "upcoming" ? !e.isPast : e.isPast
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row bg-white px-4 py-3 border-b border-gray-200">
        <Pressable
          onPress={() => setTab("upcoming")}
          className={`flex-1 py-2 rounded-lg items-center ${
            tab === "upcoming" ? "bg-black" : "bg-gray-100"
          }`}
        >
          <Text
            className={`font-medium text-sm ${
              tab === "upcoming" ? "text-white" : "text-gray-600"
            }`}
          >
            À venir
          </Text>
        </Pressable>
        <View className="w-2" />
        <Pressable
          onPress={() => setTab("past")}
          className={`flex-1 py-2 rounded-lg items-center ${
            tab === "past" ? "bg-black" : "bg-gray-100"
          }`}
        >
          <Text
            className={`font-medium text-sm ${
              tab === "past" ? "text-white" : "text-gray-600"
            }`}
          >
            Passés
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-semibold mb-2">{item.title}</Text>

            <View className="flex-row items-center mb-1.5">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2">
                {formatDate(item.date)}
              </Text>
            </View>

            <View className="flex-row items-center mb-1.5">
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-2">
                {item.location}
              </Text>
            </View>

            {item.price !== null && (
              <View className="flex-row items-center mb-3">
                <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-500 ml-2">
                  {item.price === 0 ? "Gratuit" : `${item.price} €`}
                </Text>
              </View>
            )}

            {!item.isPast && (
              <Pressable className="bg-black rounded-lg py-3 items-center mt-1">
                <Text className="text-white font-semibold text-sm">
                  S'inscrire
                </Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">
              {tab === "upcoming"
                ? "Aucun événement à venir"
                : "Aucun événement passé"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
