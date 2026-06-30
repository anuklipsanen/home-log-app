"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { typeLabels } from "@/lib/typeLabels";

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [eventData, setEventData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  async function fetchEvent() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Fetch error:", error);
      return;
    }

    setEventData(data);
  }

  function update(field: string, value: any) {
    setEventData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  function formatHelsinkiTime(dateString: string) {
    if (!dateString) return "-";

    const date = new Date(dateString);
    const helsinki = new Date(
      date.toLocaleString("en-US", {
        timeZone: "Europe/Helsinki",
      })
    );

    return helsinki.toLocaleString("fi-FI", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSave() {
    if (!eventData) return;

    const { error } = await supabase
      .from("events")
      .update({
        description: eventData.description,
        event_date: eventData.event_date,
        date: eventData.date,
        due_date: eventData.due_date,
        company: eventData.company,
        invoice_number: eventData.invoice_number,
        total_amount: eventData.total_amount,
        vat: eventData.vat,
        work_amount: eventData.work_amount,
        is_household_deduction: eventData.is_household_deduction,
        location: eventData.location,
        notes_short: eventData.notes_short,
        maintenance_type: eventData.maintenance_type,
        additional_notes: eventData.additional_notes,
        highlights: eventData.highlights,
        items: eventData.items,
        document_notes: eventData.document_notes,
        reminder_date: eventData.reminder_date,
        reminder_text: eventData.reminder_text,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("❌ Päivitys epäonnistui");
    } else {
      alert("✅ Päivitetty!");
    }
  }

  async function handleDelete() {
    if (!confirm("Haluatko varmasti poistaa tapahtuman?")) return;

    if (eventData?.file_url) {
      const path = eventData.file_url.split(
        "/storage/v1/object/public/attachments/"
      )[1];

      if (path) {
        await supabase.storage.from("attachments").remove([path]);
      }
    }

    await supabase.from("events").delete().eq("id", id);
    router.push("/events");
  }

  if (!eventData) return <p>Ladataan...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      {/* NAV */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => router.back()}>⬅️ Takaisin</button>
        <button
          onClick={() => router.push("/upload")}
          style={{ marginLeft: 10 }}
        >
          🏠 Upload
        </button>
      </div>

      {/* KUVAUS */}
      <h2>
        {editMode ? (
          <input
            value={eventData.description || ""}
            onChange={(e) =>
              update("description", e.target.value)
            }
            style={{ width: "100%" }}
          />
        ) : (
          eventData.description || "Ei kuvausta"
        )}
      </h2>

      {/* ACTIONS */}
      <button onClick={() => setEditMode(!editMode)}>
        ✏️ {editMode ? "Valmis" : "Muokkaa"}
      </button>

      <button onClick={handleSave} style={{ marginLeft: 10 }}>
        💾 Tallenna
      </button>

      <button
        onClick={handleDelete}
        style={{
          marginLeft: 10,
          backgroundColor: "#b00020",
          color: "white",
        }}
      >
        🗑 Poista
      </button>

      {/* LISÄYS AIKA */}
      <p style={{ fontSize: 12 }}>
        Lisätty: {formatHelsinkiTime(eventData.created_at)}
      </p>

      {/* TIEDOSTO */}
      {eventData.file_url && (
        <a href={eventData.file_url} target="_blank">
          📄 Avaa tiedosto
        </a>
      )}

      {/* HUOLLON TYYPPI */}
      <p>
        <b>Tyyppi:</b>{" "}
        {editMode ? (
          <select
            value={eventData.maintenance_type || ""}
            onChange={(e) =>
              update("maintenance_type", e.target.value)
            }
          >
            {Object.entries(typeLabels).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </select>
        ) : (
          typeLabels[eventData.maintenance_type] || "📄 Muu"
        )}
      </p>

      {/* ✅ TAPAHTUMAPÄIVÄ (UUSI TÄRKEIN) */}
      <p>
        <b>Tapahtumapäivä:</b>{" "}
        {editMode ? (
          <input
            type="date"
            value={eventData.event_date || ""}
            onChange={(e) =>
              update("event_date", e.target.value)
            }
          />
        ) : (
          eventData.event_date || "-"
        )}
      </p>

      {/* ✅ MUISTUTUS */}
      <h3>🔔 Muistutus</h3>

      <p>
        <b>Tarkistuspäivä:</b>{" "}
        {editMode ? (
          <input
            type="date"
            value={eventData.reminder_date || ""}
            onChange={(e) =>
              update("reminder_date", e.target.value)
            }
          />
        ) : (
          eventData.reminder_date || "-"
        )}
      </p>

      <p>
        <b>Muistutus:</b>{" "}
        {editMode ? (
          <input
            value={eventData.reminder_text || ""}
            onChange={(e) =>
              update("reminder_text", e.target.value)
            }
          />
        ) : (
          eventData.reminder_text || "-"
        )}
      </p>

      {/* PERUSTIEDOT */}
      {[
        ["date", "Laskun päivä"],
        ["due_date", "Eräpäivä"],
        ["company", "Yritys"],
        ["invoice_number", "Laskunumero"],
        ["location", "Kohde"],
        ["total_amount", "Summa"],
        ["vat", "ALV"],
        ["work_amount", "Työn osuus"],
      ].map(([key, label]) => (
        <p key={key}>
          <b>{label}:</b>{" "}
          {editMode ? (
            <input
              value={eventData[key] || ""}
              onChange={(e) =>
                update(key as string, e.target.value)
              }
            />
          ) : (
            `${eventData[key] || "-"}${
              key.includes("amount") || key === "vat"
                ? " €"
                : ""
            }`
          )}
        </p>
      ))}

      {/* BOOLEAN */}
      <p>
        <b>Kotitalousvähennys:</b>{" "}
        {editMode ? (
          <input
            type="checkbox"
            checked={
              eventData.is_household_deduction || false
            }
            onChange={(e) =>
              update(
                "is_household_deduction",
                e.target.checked
              )
            }
          />
        ) : eventData.is_household_deduction ? (
          "✅ Kyllä"
        ) : (
          "❌ Ei"
        )}
      </p>

      {/* HIGHLIGHTS */}
      <h3>🛠️ Highlights</h3>
      {eventData.highlights?.map(
        (h: string, i: number) => (
          <div key={i}>
            {editMode ? (
              <input
                value={h}
                onChange={(e) => {
                  const arr = [...eventData.highlights];
                  arr[i] = e.target.value;
                  update("highlights", arr);
                }}
              />
            ) : (
              <p>✅ {h}</p>
            )}
          </div>
        )
      )}

      {/* LISÄTIEDOT */}
      <h3>📄 Lisätiedot</h3>
      {editMode ? (
        <textarea
          value={eventData.additional_notes || ""}
          onChange={(e) =>
            update("additional_notes", e.target.value)
          }
        />
      ) : (
        <pre>{eventData.additional_notes}</pre>
      )}
    </div>
  );
}