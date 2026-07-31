import { NextRequest } from "next/server";

export async function GET(data: NextRequest){
    const preferences = await data.json();
    
}