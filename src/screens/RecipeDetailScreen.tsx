import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity } from "react-native";
import { get, remove } from "../storage/recipeStore";
import { Recipe } from "../type";
import { colors } from "../theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, "Detail">;

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => { (async () => setRecipe(await get(id)))(); }, [id]);

  if (!recipe) return <View style={s.container}><Text style={s.text}>Loading…</Text></View>;

  const del = () => {
    Alert.alert("Delete", "Remove this recipe?", [
      { text:"Cancel", style:"cancel" },
      { text:"Delete", style:"destructive", onPress: async () => {
          await remove(recipe.id);
          navigation.goBack();
        } }
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{padding:16}}>
      {recipe.imageUrl ? <Image source={{uri:recipe.imageUrl}} style={s.image}/> : null}
      <Text style={s.name}>{recipe.name}</Text>
      <Text style={s.type}>{recipe.type}</Text>

      <Text style={s.section}>Ingredients</Text>
      {recipe.ingredients.map(i => <Text key={i.id} style={s.item}>• {i.text}</Text>)}

      <Text style={s.section}>Steps</Text>
      {recipe.steps.map(sv => <Text key={sv.id} style={s.item}>• {sv.text}</Text>)}

      <View style={s.row}>
        <TouchableOpacity style={[s.btn, {backgroundColor:colors.primary}]} onPress={()=>navigation.navigate("Form",{id:recipe.id})}>
          <Text style={s.btnTxt}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, {backgroundColor:colors.danger}]} onPress={del}>
          <Text style={s.btnTxt}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.bg },
  text:{ color:colors.text },
  image:{ width:"100%", height:220, borderRadius:12, marginBottom:12, backgroundColor:"#222" },
  name:{ color:colors.text, fontSize:22, fontWeight:"700" },
  type:{ color:colors.sub, marginTop:4, marginBottom:16 },
  section:{ color:colors.text, fontSize:18, fontWeight:"700", marginTop:10, marginBottom:6 },
  item:{ color:colors.text, marginBottom:6, lineHeight:20 },
  row:{ flexDirection:"row", gap:12, marginTop:18 },
  btn:{ flex:1, padding:12, borderRadius:12, alignItems:"center" },
  btnTxt:{ color:"#06110a", fontWeight:"700" }
});
