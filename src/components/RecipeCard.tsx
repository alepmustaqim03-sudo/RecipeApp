import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Recipe } from "../type";
import { colors } from "../theme";

export default function RecipeCard({ item, onPress }:{ item:Recipe; onPress:()=>void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.card}>
      {item.imageUrl ? <Image
  source={{ uri: item.imageUrl }}
  style={s.img}
  onError={(e) => console.log("IMAGE ERROR", e.nativeEvent)}
  onLoadStart={() => console.log("IMAGE start")}
  onLoadEnd={() => console.log("IMAGE end")}
/> : <View style={[s.img, s.placeholder]}/>}
      <View style={{flex:1}}>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <Text style={s.type}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  card:{ flexDirection:"row", gap:12, padding:12, borderRadius:16, backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, alignItems:"center" },
  img:{ width:64, height:64, borderRadius:12, backgroundColor:"#222" },
  placeholder:{ borderWidth:1, borderColor:colors.border },
  name:{ color:colors.text, fontSize:16, fontWeight:"600" },
  type:{ color:colors.sub, marginTop:4 }
});
