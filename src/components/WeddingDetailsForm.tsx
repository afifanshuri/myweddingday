"use client";
import { ServiceType } from "@/types/basicTypes";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WeddingDetailsForm({
  servicesList,
}: {
  servicesList: ServiceType[];
}) {
  const route = useRouter();
  const [selectedService, setSelectedService] = useState<number[]>([]);

  const handleCheckbox = (id: number) => {
    if (selectedService.includes(id)) {
      setSelectedService(selectedService.filter((s) => s != id));
    } else {
      setSelectedService([...selectedService, id]);
    }
  };
  return (
    <div id="formContainer" className="w-3/4 border p-10">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const params = selectedService.join(",");
          route.push(`/match?serviceIds=${params}`);
        }}
      >
        <textarea placeholder="Describe your dream wedding"></textarea>
        <div className="flex flex-1 flex-row gap-4 items-stretch">
          <label className="flex flex-1 flex-col">
            Budget (RM)
            <input id="paxBudget" type="number" placeholder="Budget"></input>
          </label>
          <label className="flex flex-1 flex-col">
            No. Of Guests
            <input
              id="paxInput"
              type="number"
              defaultValue={100}
              placeholder="Number of Guests"
            ></input>
          </label>
          <div id="locationInput" className="flex flex-col flex-2">
            <p>Location</p>
            <select name="selectedLocation" defaultValue="Selangor">
              <option value="KL">Kuala Lumpur</option>
              <option value="Selangor">Selangor</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p>Services</p>
          <div className="grid grid-cols-2">
            {servicesList.map((s: ServiceType, index: number) => {
              return (
                <label key={index}>
                  <input
                    type="checkbox"
                    className="mr-1"
                    value={s.id}
                    checked={selectedService.includes(s.id)}
                    onChange={() => handleCheckbox(s.id)}
                  ></input>
                  {s.serviceName}
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="border p-2 rounded-lg w-40 text-[10px] hover:cursor-pointer"
            type="submit"
          >
            Generate my dream wedding!
          </button>
        </div>
      </form>
    </div>
  );
}
