import CustomTextarea from "../../components/commonComponents/CustomTextarea";

export const PelaminPage = () => {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <p>Describe your ideas</p>
        <CustomTextarea className="w-full" />
      </div>
    </div>
  );
};
