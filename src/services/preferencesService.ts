import { BasicPreferenceType } from "@/types/preferenceTypes";
import { createPreferencesEmbedding } from "./aiService";
import { usePreferenceStore } from "@/app/store/preferenceStore";

export async function savePreferencesDetails(preferencesList: BasicPreferenceType[] | null) {
    if(preferencesList === null) {
        console.error("No preferences data to save.");
        return;
    }
    const updatePreferenceDetail = usePreferenceStore.getState().updatePreferenceDetails;
    for(const preferences of preferencesList){
        try{
        const embedding = await fetch("/api/embeddings/preferences", {
        method:"POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify(preferences),
    }).then(res => {console.log(res);return res.json();});
    updatePreferenceDetail(preferences.serviceId, {embedding: embedding});
        } catch (error){
            console.error("Error occurred while fetching embeddings:", error);
        }
    }
}