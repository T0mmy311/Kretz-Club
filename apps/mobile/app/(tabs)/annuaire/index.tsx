import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  profession: string | null;
  company: string | null;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function AnnuaireScreen() {
  const [search, setSearch] = useState("");

  const { data: allMembers, isLoading: loadingAll } =
    trpc.member.list.useQuery();

  const { data: searchResults, isLoading: loadingSearch } =
    trpc.member.search.useQuery(
      { query: search },
      { enabled: search.length >= 2 }
    );

  const isLoading = search.length >= 2 ? loadingSearch : loadingAll;
  const members: Member[] =
    search.length >= 2 ? searchResults ?? [] : allMembers ?? [];

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Rechercher un membre..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Text className="text-base font-semibold text-gray-600">
                  {getInitials(item.firstName, item.lastName)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold">
                  {item.firstName} {item.lastName}
                </Text>
                {item.profession && (
                  <Text className="text-sm text-gray-500">
                    {item.profession}
                  </Text>
                )}
                {item.company && (
                  <Text className="text-xs text-gray-400">{item.company}</Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-400 text-base">
                {search.length >= 2
                  ? "Aucun membre trouvé"
                  : "Aucun membre dans l'annuaire"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
