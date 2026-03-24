import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function VerificationScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center items-center px-8">
      <View className="bg-gray-100 rounded-full p-6 mb-6">
        <Ionicons name="mail-outline" size={48} color="#000" />
      </View>

      <Text className="text-2xl font-bold text-center mb-3">
        Vérifiez votre email
      </Text>
      <Text className="text-base text-gray-500 text-center mb-8">
        Nous vous avons envoyé un lien de connexion. Consultez votre boîte de
        réception et cliquez sur le lien pour vous connecter.
      </Text>

      <Pressable
        onPress={() => router.back()}
        className="border border-gray-300 rounded-lg py-3 px-8"
      >
        <Text className="text-base font-medium">Retour</Text>
      </Pressable>
    </View>
  );
}
