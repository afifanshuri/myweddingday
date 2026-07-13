import Link from "next/link";

export default function MainButton({
  label,
  path,
}: {
  label: string;
  path: string;
}) {
  return (
    <div className="border rounded-2xl p-2">
      <Link href={path}>{label}</Link>
    </div>
  );
}
