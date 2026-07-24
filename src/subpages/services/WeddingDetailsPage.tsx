import CustomInput from "@/components/commonComponents/CustomInput";

export default function WeddingDetailsPage() {
  return (
    <div className="mb-10">
      <p className="opacity-50 font-light mb-4">Let&apos;s get started!</p>
      <p className="mb-4 libre-font xl:text-[20px]">
        1. Tell Us About Your Wedding
      </p>
      <div className="flex flex-col gap-8">
        <div className="w-full">
          <p>Couple&apos;s Names</p>
          <CustomInput
            type="text"
            placeholder="e.g. Amira & Syafiq"
            className="w-full"
          ></CustomInput>
        </div>
        <div className="flex flex-row gap-4">
          <div className="w-full">
            <p>Wedding Date</p>
            <CustomInput
              type="date"
              placeholder="e.g. Amira & Syafiq"
              className="w-full"
            ></CustomInput>
          </div>
          <div className="w-full">
            <p>Estimated Guests</p>
            <CustomInput
              type="number"
              defaultValue={200}
              className="w-full"
            ></CustomInput>
          </div>
        </div>
      </div>
    </div>
  );
}
