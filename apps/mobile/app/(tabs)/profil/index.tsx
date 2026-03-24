import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

export default function ProfilScreen() {
  const { signOut } = useAuth();
  const { data: profile, isLoading } = trpc.member.me.useQuery();
  const utils = trpc.useUtils();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
      setProfession(profile.profession ?? "");
      setBio(profile.bio ?? "");
      setCompany(profile.company ?? "");
      setPhone(profile.phone ?? "");
      setLinkedin(profile.linkedin ?? "");
    }
  }, [profile]);

  const updateMutation = trpc.member.updateProfile.useMutation({
    onSuccess: () => {
      utils.member.me.invalidate();
      Alert.alert("Succès", "Votre profil a été mis à jour.");
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de mettre à jour votre profil.");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      firstName,
      lastName,
      profession,
      bio,
      company,
      phone,
      linkedin,
    });
  };

  const handleSignOut = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16 }}>
      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mb-2">
          <Text className="text-2xl font-bold text-gray-500">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </Text>
        </View>
        <Text className="text-lg font-semibold">
          {firstName} {lastName}
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Prénom</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Votre prénom"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Nom</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Votre nom"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Profession
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          value={profession}
          onChangeText={setProfession}
          placeholder="Votre profession"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Bio</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          value={bio}
          onChangeText={setBio}
          placeholder="Quelques mots sur vous"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Entreprise
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          value={company}
          onChangeText={setCompany}
          placeholder="Nom de votre entreprise"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Téléphone
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          value={phone}
          onChangeText={setPhone}
          placeholder="+33 6 12 34 56 78"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          LinkedIn
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          value={linkedin}
          onChangeText={setLinkedin}
          placeholder="https://linkedin.com/in/votre-profil"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={updateMutation.isPending}
        className="bg-black rounded-lg py-4 items-center mb-4"
      >
        {updateMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            Enregistrer
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={handleSignOut}
        className="border border-red-300 rounded-lg py-4 items-center mb-8"
      >
        <Text className="text-red-600 font-semibold text-base">
          Se déconnecter
        </Text>
      </Pressable>
    </ScrollView>
  );
}
