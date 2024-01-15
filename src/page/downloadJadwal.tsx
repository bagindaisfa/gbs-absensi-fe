import React, { useState } from "react";
import {
  Button,
  DatePicker,
  DatePickerProps,
  Form,
  message,
  Select,
} from "antd";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const { Option } = Select;

const DownloadJadwal: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [idLokasi, setIdLokasi] = useState(0);
  const [namaLokasi, setNamaLokasi] = useState("");
  const [month, setMonth] = useState<any>("");
  const [absensiList, setAbsensiList] = useState([]);
  const [lokasiList, setLokasiList] = useState([]);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const absensiURL = "https://internal.gbssecurindo.co.id/downloadjadwal";
  const lokasiURL = "https://internal.gbssecurindo.co.id/masterlokasi";
  const dateFormat = "YYYY-MM-DD";

  const getLokasi = async () => {
    try {
      const response = await fetch(lokasiURL); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setLokasiList(result.lokasi);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const getAbsensi = async () => {
    setLoadingDownload(true);
    try {
      const response = await fetch(
        absensiURL + "?month=" + month + "&id_lokasi=" + idLokasi
      );
      if (!response.ok) {
        setLoadingDownload(false);
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        const data = result.jadwal.map((item: any) => {
          return {
            ...item,
            start_date: dayjs(item.start_date).format(dateFormat),
            end_date: dayjs(item.end_date).format(dateFormat),
          };
        });

        setAbsensiList(data);
        setLoadingDownload(false);
      }
    } catch (error) {
      setLoadingDownload(false);
      console.log("Error fetching data:", error);
    }
  };

  const onChangeLokasi = (value: number) => {
    setIdLokasi(value);
    lokasiList.map((item: any) => {
      if (item.id == value) {
        setNamaLokasi(item.nama_lokasi);
      }
    });
  };

  const onChangeDate: DatePickerProps["onChange"] = (date, dateString) => {
    setMonth(dateString);
  };

  React.useEffect(() => {
    getAbsensi();
  }, [month, idLokasi]);

  React.useEffect(() => {
    getLokasi();
  }, []);

  async function getDaysInMonth() {
    // Extract year and month from the string
    const [year, mnth] = month.split("-");

    // Create a Date object for the next month
    const nextMonthDate = new Date(year, mnth, 0);

    // Return the number of days in the month
    return nextMonthDate.getDate();
  }

  const exportToExcel = async (data: any, filename: any) => {
    const daysInMonth = await getDaysInMonth(); // Replace with actual days in the month

    const ws = XLSX.utils.aoa_to_sheet([]);

    // Create headers
    const headers = ["nama"];
    for (let i = 1; i <= daysInMonth; i++) {
      headers.push(i.toString());
    }
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: -1 });

    // Create a map to store shifts for each employee
    const employeeShiftsMap = new Map();

    // Populate the map with shifts for each employee
    data.forEach((item: any) => {
      if (!employeeShiftsMap.has(item.nama)) {
        employeeShiftsMap.set(item.nama, []);
      }
      employeeShiftsMap.get(item.nama).push(item);
    });

    // Create rows for each employee
    employeeShiftsMap.forEach((shifts, employeeName) => {
      const row = [employeeName];

      // Initialize an array to hold shifts for each day
      const shiftsForDays = new Array(daysInMonth).fill("");

      shifts.forEach((shift: any) => {
        const startDate = new Date(shift.start_date);
        const endDate = new Date(shift.end_date);

        for (let i = startDate.getDate() - 1; i <= endDate.getDate() - 1; i++) {
          if (shift.shift === "OFF") {
            shiftsForDays[i] = "OFF";
          } else {
            shiftsForDays[i] = `${shift.jam_masuk} - ${shift.jam_keluar}`;
          }
        }
      });

      row.push(...shiftsForDays);
      XLSX.utils.sheet_add_aoa(ws, [row], { origin: -1 });
    });

    // Create workbook and write to file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Convert workbook to a binary string and create a Blob
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = url;
    a.download = `${filename}.xlsx`;
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const error = () => {
    messageApi.open({
      type: "error",
      content: "Pilih Lokasi!",
    });
  };

  const handleExportClick = () => {
    if (idLokasi != 0) {
      exportToExcel(absensiList, "jadwal_" + namaLokasi + "_" + month);
    } else {
      error();
    }
  };

  return (
    <>
      {contextHolder}
      <Form layout="vertical" form={form} style={{ maxWidth: 600 }}>
        <Form.Item label="Pilih Bulan">
          <DatePicker onChange={onChangeDate} picker="month" />
        </Form.Item>
        <Form.Item label="Lokasi">
          <Select
            placeholder="pilih lokasi"
            onChange={onChangeLokasi}
            allowClear
            value={idLokasi}
            style={{ maxWidth: 265 }}
          >
            {lokasiList?.map((item: any) => {
              return <Option value={item.id}>{item.nama_lokasi}</Option>;
            })}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button onClick={handleExportClick} loading={loadingDownload}>
            Download
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default DownloadJadwal;
