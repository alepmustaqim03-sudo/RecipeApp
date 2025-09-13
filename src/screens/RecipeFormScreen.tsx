import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  Image, Platform, Modal, Pressable, KeyboardAvoidingView,Alert
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import types from "../data/recipeTypes.json";
import { add, get, update } from "../storage/recipeStore";
import { Ingredient, Recipe, Step } from "../type";
import { colors } from "../theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import {
  launchImageLibrary, launchCamera,
  ImageLibraryOptions, CameraOptions
} from "react-native-image-picker";
import { check, request, PERMISSIONS, RESULTS, openSettings } from "react-native-permissions";

type Props = NativeStackScreenProps<any, "Form">;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export default function RecipeFormScreen({ route, navigation }: Props) {
  const editingId = route.params?.id as string | undefined;
  const insets = useSafeAreaInsets();

  // form state
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(types[0]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: uid(), text: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ id: uid(), text: "" }]);

  // modals
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [showDiscardSheet, setShowDiscardSheet] = useState(false);

  // leave-guard
  const initialSnapshotRef = useRef<string>("");
  const pendingNavActionRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // load data
  useEffect(() => {
    (async () => {
      if (editingId) {
        const r = await get(editingId);
        if (r) {
          setName(r.name);
          setType(r.type);
          setImageUrl(r.imageUrl ?? "");
          setIngredients(r.ingredients.length ? r.ingredients : [{ id: uid(), text: "" }]);
          setSteps(r.steps.length ? r.steps : [{ id: uid(), text: "" }]);

          initialSnapshotRef.current = JSON.stringify({
            name: r.name,
            type: r.type,
            imageUrl: r.imageUrl ?? "",
            ingredients: r.ingredients.map(x => ({ text: (x.text || "").trim() })).filter(x => x.text),
            steps: r.steps.map(x => ({ text: (x.text || "").trim() })).filter(x => x.text),
          });
        }
      } else {
        initialSnapshotRef.current = JSON.stringify({
          name: "",
          type: types[0],
          imageUrl: "",
          ingredients: [],
          steps: [],
        });
      }
    })();
  }, [editingId]);

  // --- permissions helpers ---
  const ensureGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS === "ios") {
      const st = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (st === RESULTS.GRANTED || st === RESULTS.LIMITED) return true;
      const r = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return r === RESULTS.GRANTED || r === RESULTS.LIMITED;
    } else {
      const perm = Platform.Version >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      const st = await check(perm);
      if (st === RESULTS.GRANTED) return true;
      const r = await request(perm);
      return r === RESULTS.GRANTED;
    }
  };

  const ensureCameraPermission = async (): Promise<boolean> => {
    const perm = Platform.OS === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    const st = await check(perm);
    if (st === RESULTS.GRANTED) return true;
    const r = await request(perm);
    if (r === RESULTS.GRANTED) return true;
    if (r === RESULTS.BLOCKED) {
      setShowMediaSheet(false);
      setTimeout(() => openSettings(), 200);
    }
    return false;
  };

  // --- media actions ---
  const pickFromGallery = async () => {
    const ok = await ensureGalleryPermission();
    if (!ok) return;
    const opts: ImageLibraryOptions = { mediaType: "photo", selectionLimit: 1, quality: 0.85 };
    const res = await launchImageLibrary(opts);
    if (!res.didCancel && res.assets?.[0]?.uri) setImageUrl(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) return;
    const opts: CameraOptions = { mediaType: "photo", quality: 0.85, saveToPhotos: true };
    const res = await launchCamera(opts);
    if (!res.didCancel && res.assets?.[0]?.uri) setImageUrl(res.assets[0].uri);
  };

  const removeImage = () => setImageUrl("");

  // --- dirty check (ignore blanks) ---
  const normalized = useMemo(() => ({
    name: name.trim(),
    type,
    imageUrl: imageUrl.trim(),
    ingredients: ingredients.map(i => (i.text || "").trim()).filter(Boolean).map(text => ({ text })),
    steps: steps.map(s => (s.text || "").trim()).filter(Boolean).map(text => ({ text })),
  }), [name, type, imageUrl, ingredients, steps]);

  const isDirty = useMemo(
    () => JSON.stringify(normalized) !== initialSnapshotRef.current,
    [normalized]
  );

  // --- intercept leaving ---
  const prevent = isDirty && !isSaving;
  usePreventRemove(prevent, (e) => {
    if (isSaving) return;
    pendingNavActionRef.current = e.data.action;
    setShowDiscardSheet(true);
  });

  useEffect(() => {
    navigation.setOptions({
      headerBackButtonMenuEnabled: false,
      gestureEnabled: !prevent,
    });
  }, [navigation, prevent]);

  const confirmDiscard = () => {
    setShowDiscardSheet(false);
    const action = pendingNavActionRef.current;
    pendingNavActionRef.current = null;
    if (action) navigation.dispatch(action);
  };
  const cancelDiscard = () => {
    pendingNavActionRef.current = null;
    setShowDiscardSheet(false);
  };

  // --- submit ---
  const submit = async () => {
    const cleanedIngredients = normalized.ingredients.filter(i => i.text.length > 0);
    const cleanedSteps = normalized.steps.filter(s => s.text.length > 0);

    if (!name.trim()) {
      alert("Recipe name is required.");
      return;
    }
    if (cleanedIngredients.length === 0) {
      alert("At least 1 ingredient is required.");
      return;
    }
    if (cleanedSteps.length === 0) {
      alert("At least 1 step is required.");
      return;
    }

    const payload = {
      name: normalized.name,
      type: normalized.type,
      imageUrl: normalized.imageUrl || undefined,
      ingredients: cleanedIngredients,
      steps: cleanedSteps,
    };

    setIsSaving(true);
    await new Promise(res => setTimeout(res, 0)); // let prevent flip to false

    try {
      if (editingId) {
        await update(editingId, payload as Partial<Recipe>);
      } else {
        await add(payload as any);
      }
      initialSnapshotRef.current = JSON.stringify({
        ...payload,
        imageUrl: payload.imageUrl ?? "",
      });
      navigation.goBack();
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  // row helpers
  const addRow = (kind: "i" | "s") => {
    kind === "i"
      ? setIngredients(prev => [...prev, { id: uid(), text: "" }])
      : setSteps(prev => [...prev, { id: uid(), text: "" }]);
  };

  const setRow = (kind: "i" | "s", id: string, text: string) => {
    if (kind === "i") setIngredients(prev => prev.map(x => x.id === id ? { ...x, text } : x));
    else setSteps(prev => prev.map(x => x.id === id ? { ...x, text } : x));
  };

  const removeRow = (kind: "i" | "s", id: string) => {
    if (kind === "i") setIngredients(prev => prev.filter(x => x.id !== id));
    else setSteps(prev => prev.filter(x => x.id !== id));
  };

  return (
    <SafeAreaView style={s.container} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: "padding" })}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: Math.max(40, insets.bottom + 16) }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={s.title}>{editingId ? "Edit" : "Add"} Recipe</Text>

          <Text style={s.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g., Chicken Curry" placeholderTextColor={colors.sub} style={s.input} />

          <Text style={s.label}>Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {types.map(t => (
              <TouchableOpacity key={t} onPress={() => setType(t)} style={[s.chip, type === t && s.chipActive]}>
                <Text style={[s.chipTxt, type === t && { color: "#06110a" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Recipe Image (optional)</Text>
          {imageUrl ? (
            <View>
              <Image source={{ uri: imageUrl }} style={s.image} />
              <View style={s.row}>
                <TouchableOpacity style={[s.btnSm, s.btnNeutral]} onPress={() => setShowMediaSheet(true)}>
                  <Text style={s.btnNeutralTxt}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnSm, s.btnDanger]} onPress={removeImage}>
                  <Text style={s.btnDangerTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={[s.btnLg, s.btnNeutral]} onPress={() => setShowMediaSheet(true)}>
              <Text style={s.btnNeutralTxt}>＋ Add Photo</Text>
            </TouchableOpacity>
          )}

          <Text style={s.label}>Ingredients</Text>
          {ingredients.map((i, idx) => (
            <View key={i.id} style={s.rowInput}>
              <TextInput
                value={i.text}
                onChangeText={(t) => setRow("i", i.id, t)}
                placeholder={`Ingredient ${idx + 1}`}
                placeholderTextColor={colors.sub}
                style={[s.input, { flex: 1 }]}
              />
              {idx > 0 && (
                <TouchableOpacity onPress={() => removeRow("i", i.id)} style={s.removeBtn}>
                  <Text style={s.removeBtnTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={() => addRow("i")} style={s.addRow}>
            <Text style={s.addRowTxt}>+ Add ingredient</Text>
          </TouchableOpacity>

          <Text style={s.label}>Steps</Text>
          {steps.map((st, idx) => (
            <View key={st.id} style={s.rowInput}>
              <TextInput
                value={st.text}
                onChangeText={(t) => setRow("s", st.id, t)}
                placeholder={`Step ${idx + 1}`}
                placeholderTextColor={colors.sub}
                style={[s.input, { flex: 1 }]}
              />
              {idx > 0 && (
                <TouchableOpacity onPress={() => removeRow("s", st.id)} style={s.removeBtn}>
                  <Text style={s.removeBtnTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={() => addRow("s")} style={s.addRow}>
            <Text style={s.addRowTxt}>+ Add step</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.submit} onPress={submit}>
            <Text style={s.submitTxt}>{editingId ? "Save Changes" : "Create Recipe"}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ---- media picker sheet ---- */}
        <Modal visible={showMediaSheet} transparent animationType="slide" onRequestClose={() => setShowMediaSheet(false)}>
          <Pressable style={s.backdrop} onPress={() => setShowMediaSheet(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Choose Photo</Text>
            <TouchableOpacity style={s.sheetBtn} onPress={async () => { setShowMediaSheet(false); await takePhoto(); }}>
              <Text style={s.sheetBtnTxt}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetBtn} onPress={async () => { setShowMediaSheet(false); await pickFromGallery(); }}>
              <Text style={s.sheetBtnTxt}>Pick from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.sheetBtn, s.sheetCancel]} onPress={() => setShowMediaSheet(false)}>
              <Text style={[s.sheetBtnTxt, { color: colors.sub }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* ---- discard confirm sheet ---- */}
        <Modal visible={showDiscardSheet} transparent animationType="slide" onRequestClose={cancelDiscard}>
          <Pressable style={s.backdrop} onPress={cancelDiscard} />
          <View style={[s.confirmCard, { paddingBottom: Math.max(16, insets.bottom) }]}>
            <Text style={s.confirmTitle}>{editingId ? "Discard changes?" : "Discard new recipe?"}</Text>
            <Text style={s.confirmMsg}>
              {editingId
                ? "You have unsaved edits. Are you sure you want to leave without saving?"
                : "You’ve started creating a recipe. Discard and leave?"}
            </Text>
            <View style={s.confirmRow}>
              <TouchableOpacity style={[s.btnSm, s.btnNeutral]} onPress={cancelDiscard}>
                <Text style={s.btnNeutralTxt}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnSm, s.btnDanger]} onPress={confirmDiscard}>
                <Text style={s.btnDangerTxt}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 12 },
  label: { color: colors.sub, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 12, borderRadius: 12 },
  rowInput: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },

  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignSelf: "flex-start" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { color: colors.text, fontWeight: "600" },

  image: { width: "100%", height: 210, borderRadius: 14, backgroundColor: "#1d1d1d", borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", gap: 10, marginTop: 8 },

  btnLg: { paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnSm: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnNeutral: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnNeutralTxt: { color: colors.text, fontWeight: "700" },
  btnDanger: { backgroundColor: colors.danger },
  btnDangerTxt: { color: "#06110a", fontWeight: "800" },

  addRow: { marginTop: 6, alignSelf: "flex-start" },
  addRowTxt: { color: colors.primary, fontWeight: "700" },
  submit: { marginTop: 18, backgroundColor: colors.primary, padding: 14, borderRadius: 14, alignItems: "center" },
  submitTxt: { color: "#06110a", fontWeight: "800" },

  removeBtn: { backgroundColor: colors.danger, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  removeBtnTxt: { color: "#06110a", fontWeight: "800" },

  // bottom sheets
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, borderTopWidth: 1, borderColor: colors.border
  },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, marginBottom: 10 },
  sheetTitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginBottom: 6 },
  sheetBtn: { paddingVertical: 14, alignItems: "center", borderRadius: 12, backgroundColor: "#111820", borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  sheetBtnTxt: { color: colors.text, fontWeight: "700" },
  sheetCancel: { backgroundColor: colors.card },

  // confirm card
  confirmCard: {
    position: "absolute", left: 16, right: 16, bottom: 24,
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border
  },
  confirmTitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginBottom: 6 },
  confirmMsg: { color: colors.sub, marginBottom: 12, lineHeight: 20 },
  confirmRow: { flexDirection: "row", gap: 10 }
});
