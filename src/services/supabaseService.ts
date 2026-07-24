import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { generateFilename } from "./utils";

const saveImageToBucket = async (
  pathURL: string,
  file: File | null,
  fileName: string | null,
) => {
  if (file) {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data, error } = await supabase.storage
      .from(pathURL)
      .upload(fileName ?? generateFilename(null), file);
    console.log("error " + error);
    console.log(data);
    return data?.fullPath;
  }
};

const retrieveImageFromBucket = async (pathURL: string, fileName: string) => {
  if (pathURL) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.storage
      .from(pathURL)
      .download(fileName);
    return data;
  }
};

export { saveImageToBucket, retrieveImageFromBucket };
