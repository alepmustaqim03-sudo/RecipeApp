import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getAll, bootstrapIfEmpty } from "../storage/recipeStore";
import types from "../data/recipeTypes.json";
import { Recipe } from "../type";
import RecipeCard from "../components/RecipeCard";
import { colors } from "../theme";

type RootStackParamList = {
  List: undefined;
  Detail: { id: string };
  Form: { id?: string };
};

export default function RecipeListScreen() {
  const nav = useNavigation<NativeStackScreenProps<RootStackParamList>["navigation"]>();
  const [list, setList] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<string | "ALL">("ALL");
  const isFocused = useIsFocused();

  useEffect(() => { (async () => {
    await bootstrapIfEmpty();
    setList(await getAll());
  })(); }, [isFocused]);

  const filtered = useMemo(
    () => selected==="ALL" ? list : list.filter(r=>r.type===selected),
    [list, selected]
  );

  return (
    <View style={s.container}>
      <Text style={s.title}>Recipes</Text>

      {/* type filter */}
      <FlatList
        horizontal
        data={["ALL", ...types]}
        keyExtractor={(k)=>String(k)}
        showsHorizontalScrollIndicator={false}
        style={{marginVertical:12}}
        contentContainerStyle={{gap:8, paddingHorizontal:12}}
        renderItem={({item}) => (
          <TouchableOpacity onPress={()=>setSelected(item as any)} style={[s.chip, selected===item && s.chipActive]}>
            <Text style={[s.chipText, selected===item && {color:"#06110a"}]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* list */}
      <FlatList
        data={filtered}
        keyExtractor={(x)=>x.id}
        ItemSeparatorComponent={()=><View style={{height:10}} />}
        contentContainerStyle={{padding:12, paddingBottom:24}}
        renderItem={({item})=>(
          <RecipeCard item={item} onPress={()=>nav.navigate("Detail",{id:item.id})}/>
        )}
        ListEmptyComponent={<Text style={s.empty}>No recipes yet. Tap + to add.</Text>}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={()=>nav.navigate("Form",{})}>
        <Text style={{color:"#06110a", fontWeight:"700", fontSize:20}}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.bg },
  title:{ color:colors.text, fontSize:24, fontWeight:"700", paddingHorizontal:12, paddingTop:12 },
  chip:{ paddingVertical:8, paddingHorizontal:12, borderRadius:999, borderWidth:1, borderColor:colors.border, backgroundColor:colors.card },
  chipActive:{ backgroundColor:colors.primary, borderColor:colors.primary },
  chipText:{ color:colors.text, fontWeight:"600" },
  empty:{ color:colors.sub, textAlign:"center", marginTop:40 },
  fab:{ position:"absolute", right:18, bottom:22, backgroundColor:colors.primary, paddingVertical:12, paddingHorizontal:18, borderRadius:999, elevation:4 }
});
