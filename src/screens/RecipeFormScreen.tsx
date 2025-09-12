import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity} from "react-native";
import types from "../data/recipeTypes.json";
import { add, get, update } from "../storage/recipeStore";
import { Ingredient, Recipe, Step } from "../type";
import { colors } from "../theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, "Form">;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export default function RecipeFormScreen({ route, navigation }: Props) {
  const editingId = route.params?.id as string | undefined;

  const [name, setName] = useState("");
  const [type, setType] = useState<string>(types[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{id:uid(), text:""}]);
  const [steps, setSteps] = useState<Step[]>([{id:uid(), text:""}]);

  useEffect(() => { (async () => {
    if (editingId) {
      const r = await get(editingId);
      if (r) {
        setName(r.name); setType(r.type); setImageUrl(r.imageUrl ?? "");
        setIngredients(r.ingredients.length? r.ingredients : [{id:uid(), text:""}]);
        setSteps(r.steps.length? r.steps : [{id:uid(), text:""}]);
      }
    }
  })(); }, [editingId]);

  const submit = async () => {
    if (!name.trim()) return alert("Recipe name is required");
    const payload = {
      name: name.trim(),
      type,
      imageUrl: imageUrl.trim() || undefined,
      ingredients: ingredients.filter(i=>i.text.trim().length>0),
      steps: steps.filter(s=>s.text.trim().length>0),
    };
    if (editingId) {
      await update(editingId, payload as Partial<Recipe>);
    } else {
      await add(payload as any);
    }
    navigation.goBack();
  };

  const addRow = (kind:"i"|"s") => {
    kind==="i"
      ? setIngredients(prev=>[...prev,{id:uid(), text:""}])
      : setSteps(prev=>[...prev,{id:uid(), text:""}]);
  };

  const setRow = (kind:"i"|"s", id:string, text:string) => {
    if (kind==="i") setIngredients(prev=>prev.map(x=>x.id===id? {...x, text} : x));
    else setSteps(prev=>prev.map(x=>x.id===id? {...x, text} : x));
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{padding:16, paddingBottom:40}}>
      <Text style={s.title}>{editingId? "Edit" : "Add"} Recipe</Text>

      <Text style={s.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g., Chicken Curry" placeholderTextColor={colors.sub} style={s.input} />

      <Text style={s.label}>Type</Text>
      {/* simple picker via chips to keep native deps zero */}
      <View style={{flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:8}}>
        {types.map(t => (
          <TouchableOpacity key={t} onPress={()=>setType(t)} style={[s.chip, type===t && s.chipActive]}>
            <Text style={[s.chipTxt, type===t && {color:"#06110a"}]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Image URL (optional)</Text>
      <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="https://…" placeholderTextColor={colors.sub} style={s.input} />

      <Text style={s.label}>Ingredients</Text>
      {ingredients.map((i, idx)=>(
        <TextInput key={i.id} value={i.text} onChangeText={(t)=>setRow("i", i.id, t)}
          placeholder={`Ingredient ${idx+1}`} placeholderTextColor={colors.sub} style={s.input}/>
      ))}
      <TouchableOpacity onPress={()=>addRow("i")} style={s.addRow}><Text style={s.addRowTxt}>+ Add ingredient</Text></TouchableOpacity>

      <Text style={s.label}>Steps</Text>
      {steps.map((st, idx)=>(
        <TextInput key={st.id} value={st.text} onChangeText={(t)=>setRow("s", st.id, t)}
          placeholder={`Step ${idx+1}`} placeholderTextColor={colors.sub} style={s.input}/>
      ))}
      <TouchableOpacity onPress={()=>addRow("s")} style={s.addRow}><Text style={s.addRowTxt}>+ Add step</Text></TouchableOpacity>

      <TouchableOpacity style={s.submit} onPress={submit}>
        <Text style={s.submitTxt}>{editingId? "Save Changes" : "Create Recipe"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.bg },
  title:{ color:colors.text, fontSize:22, fontWeight:"700", marginBottom:12 },
  label:{ color:colors.sub, marginTop:10, marginBottom:6 },
  input:{ backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, color:colors.text, padding:12, borderRadius:12 },
  chip:{ paddingVertical:8, paddingHorizontal:12, borderRadius:999, borderWidth:1, borderColor:colors.border, backgroundColor:colors.card },
  chipActive:{ backgroundColor:colors.primary, borderColor:colors.primary },
  chipTxt:{ color:colors.text, fontWeight:"600" },
  addRow:{ marginTop:6, alignSelf:"flex-start" },
  addRowTxt:{ color:colors.primary, fontWeight:"700" },
  submit:{ marginTop:18, backgroundColor:colors.primary, padding:14, borderRadius:14, alignItems:"center" },
  submitTxt:{ color:"#06110a", fontWeight:"800" }
});
