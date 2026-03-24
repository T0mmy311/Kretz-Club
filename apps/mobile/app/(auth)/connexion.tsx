import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function ConnexionScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await signIn(email.trim());

    setLoading(false);

    if (error) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } else {
      router.push("/(auth)/verification");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-4xl font-bold text-center mb-2">
          Kretz Club
        </Text>
        <Text className="text-base text-gray-500 text-center mb-12">
          Le club d'investissement immobilier
        </Text>

        <Text className="text-sm font-medium text-gray-700 mb-2">
          Adresse email
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="vous@exemple.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        {error && (
          <Text className="text-red-500 text-sm mb-4">{error}</Text>
        )}

        <Pressable
          onPress={handleSignIn}
          disabled={loading}
          className="bg-black rounded-lg py-4 items-center"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Recevoir le lien magique
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
