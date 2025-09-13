import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { get, remove } from "../storage/recipeStore";
import { Recipe } from "../type";
import { colors } from "../theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, "Detail">;

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    (async () => setRecipe(await get(id)))();
  }, [id]);

  const confirmDelete = async () => {
    if (!recipe) return;
    await remove(recipe.id);
    setShowDelete(false);
    navigation.goBack();
  };

  if (!recipe) {
    return (
      <View style={s.container}>
        <Text style={s.text}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Image or placeholder */}
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={s.image} />
        ) : (
          <View style={[s.image, s.placeholder]}>
            <Text style={s.placeholderTxt}>No Image</Text>
          </View>
        )}

        <Text style={s.name}>{recipe.name}</Text>
        <Text style={s.type}>{recipe.type}</Text>

        {/* Ingredients */}
        <Text style={s.section}>Ingredients</Text>
        {recipe.ingredients.length > 0 ? (
          recipe.ingredients.map((i) => (
            <Text key={i.id} style={s.item}>
              • {i.text}
            </Text>
          ))
        ) : (
          <Text style={s.empty}>No ingredients listed.</Text>
        )}

        {/* Steps */}
        <Text style={s.section}>Steps</Text>
        {recipe.steps.length > 0 ? (
          recipe.steps.map((st) => (
            <Text key={st.id} style={s.item}>
              • {st.text}
            </Text>
          ))
        ) : (
          <Text style={s.empty}>No steps listed.</Text>
        )}

        {/* Buttons */}
        <View style={s.row}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("Form", { id: recipe.id })}
          >
            <Text style={s.btnTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.danger }]}
            onPress={() => setShowDelete(true)}
          >
            <Text style={s.btnTxt}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fancy delete confirm modal */}
      <Modal
        visible={showDelete}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDelete(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setShowDelete(false)} />
        <View style={s.confirmCard}>
          <Text style={s.confirmTitle}>Delete recipe?</Text>
          <Text style={s.confirmMsg}>
            This action can’t be undone. “{recipe.name}” will be removed from
            your list.
          </Text>
          <View style={s.confirmRow}>
            <TouchableOpacity
              style={[s.btnSm, s.btnNeutral]}
              onPress={() => setShowDelete(false)}
            >
              <Text style={s.btnNeutralTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSm, s.btnDanger]}
              onPress={confirmDelete}
            >
              <Text style={s.btnDangerTxt}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  text: { color: colors.text },

  // Image & placeholder
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#222",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTxt: {
    color: colors.sub,
    fontSize: 16,
    fontStyle: "italic",
  },

  name: { color: colors.text, fontSize: 22, fontWeight: "700" },
  type: { color: colors.sub, marginTop: 4, marginBottom: 16 },

  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  item: { color: colors.text, marginBottom: 6, lineHeight: 20 },
  empty: { color: colors.sub, fontStyle: "italic", marginBottom: 6 },

  row: { flexDirection: "row", gap: 12, marginTop: 18 },
  btn: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  btnTxt: { color: "#06110a", fontWeight: "700" },

  // modal styles
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  confirmCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
  },
  confirmMsg: { color: colors.sub, marginBottom: 12, lineHeight: 20 },
  confirmRow: { flexDirection: "row", gap: 10 },

  btnSm: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnNeutral: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnNeutralTxt: { color: colors.text, fontWeight: "700" },
  btnDanger: { backgroundColor: colors.danger },
  btnDangerTxt: { color: "#06110a", fontWeight: "800" },
});
