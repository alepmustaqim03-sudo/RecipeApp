export type RecipeType = String;

export type Ingredient = {id: string; text:string};
export type Step = {id:string; text:string};

export type Recipe = {
    id:string;
    name: string;
    type: RecipeType;
    imageUrl?:string;
    ingredients: Ingredient[];
    steps:Step[];
    createdAt:number;
    updatedAt:number;
}