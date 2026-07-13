import { ProgressBar } from "@/components/commonComponents/ProgressBar";
import { BudgetSlider } from "@/components/serviceComponents/BudgetSlider";
import DirectionButtons from "@/components/serviceComponents/DirectionButtons";

export default function VendorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="flex flex-col mt-20 mb-10">{children}</div>
    </div>
  );
}
