import AsyncStorage from '@react-native-async-storage/async-storage';
import seed from "../data/seedRecipes.json";
import { Recipe } from "../type";

const KEY = "recipes.v1";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export async function getAll(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Recipe[]; } catch { return []; }
}

export async function saveAll(list: Recipe[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function bootstrapIfEmpty() {
  const existing = await getAll();
  if (existing.length === 0) {
    const now = Date.now();
    const seeded: Recipe[] = (seed as Recipe[]).map(r => ({
      ...r, createdAt: now, updatedAt: now
    }));
    await saveAll(seeded);
  }
}

export async function add(recipe: Omit<Recipe, "id"|"createdAt"|"updatedAt">) {
  const list = await getAll();
  const rec: Recipe = { ...recipe, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
  const next = [rec, ...list];
  await saveAll(next);
  return rec;
}

export async function update(id: string, patch: Partial<Recipe>) {
  const list = await getAll();
  const next = list.map(r => r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r);
  await saveAll(next);
}

export async function remove(id: string) {
  const list = await getAll();
  await saveAll(list.filter(r => r.id !== id));
}

export async function get(id: string) {
  const list = await getAll();
  return list.find(r => r.id === id) ?? null;
}