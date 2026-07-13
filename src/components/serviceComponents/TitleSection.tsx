export default function TitleSection({
  label,
  className = " ",
}: {
  label: string;
  className: string;
}) {
  return <p className={`text-[30px] ${className}`}>{label}</p>;
}
