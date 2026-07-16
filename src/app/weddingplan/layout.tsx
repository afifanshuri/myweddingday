import { ProgressBar } from "@/components/commonComponents/ProgressBar";
import { BudgetSlider } from "@/components/serviceComponents/BudgetSlider";
import DirectionButtons from "@/components/serviceComponents/DirectionButtons";
import "../globals.css";

export default function VendorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full pt-10 flex flex-col xl:w-1/3 mx-auto pl-10 pr-10 pb-10">
      {children}
    </div>
  );
}
