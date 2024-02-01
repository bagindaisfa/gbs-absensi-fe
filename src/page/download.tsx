import React, { useState } from "react";
import { Button, DatePicker, Form, message, Select } from "antd";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Download: React.FC = () => {
  const [form] = Form.useForm();
  const currentDate = new Date();
  const [messageApi, contextHolder] = message.useMessage();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 as months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  const dateFormat = "YYYY-MM-DD";
  const [idLokasi, setIdLokasi] = useState(0);
  const [namaLokasi, setNamaLokasi] = useState("");
  const [startDate, setStartDate] = useState(formattedDate);
  const [endDate, setEndDate] = useState(formattedDate);
  const [absensiList, setAbsensiList] = useState([]);
  const [summaryList, setSummaryList] = useState([]);
  const [lokasiList, setLokasiList] = useState([]);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const absensiURL = "https://internal.gbssecurindo.co.id/absensibylokasi";
  const lokasiURL = "https://internal.gbssecurindo.co.id/masterlokasi";

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
        absensiURL +
          "?start_date=" +
          startDate +
          "&end_date=" +
          endDate +
          "&id_lokasi=" +
          idLokasi
      ); // Replace with your API endpoint
      if (!response.ok) {
        setLoadingDownload(false);
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        const groupedData = result.absensi.reduce((acc: any, item: any) => {
          const existingItem = acc.find(
            (el: any) =>
              el.nama_karyawan === item.nama &&
              el.hari === item.day_name &&
              el.tanggal === item.tanggal_range
          );

          const ket =
            item.alasan && item.alasan !== ""
              ? item.keterangan + ", " + item.alasan
              : item.keterangan;

          if (existingItem) {
            if (item.status === "Hadir") {
              existingItem.jam_masuk = item.timestamp;
              if (
                existingItem.status === "Pulang" &&
                existingItem.keterangan != "Backup"
              ) {
                existingItem.keterangan =
                  ket + " dan " + existingItem.keterangan;
              } else {
                existingItem.keterangan = ket;
              }
            } else if (item.status === "Pulang") {
              existingItem.jam_keluar = item.timestamp;
              if (
                existingItem.status === "Hadir" &&
                existingItem.keterangan != "Backup"
              ) {
                existingItem.keterangan += " dan " + ket;
              } else {
                existingItem.keterangan = ket;
              }
            } else {
              existingItem.jam_masuk = item.timestamp; // For other statuses
              existingItem.keterangan = ket;
            }
          } else {
            const newItem: any = {
              lokasi: item.lokasi,
              nama_karyawan: item.nama,
              shift: item.shift,
              hari: item.day_name,
              tanggal: item.tanggal_range,
              status: item.status,
              keterangan: ket,
            };
            if (item.status === "Hadir") {
              newItem.jam_masuk = item.timestamp;
            } else if (item.status === "Pulang") {
              newItem.jam_keluar = item.timestamp;
            } else {
              newItem.jam_masuk = item.timestamp; // For other statuses
            }
            acc.push(newItem);
          }

          return acc;
        }, []);

        setAbsensiList(groupedData);
        await getSummary(groupedData);
      }
    } catch (error) {
      setLoadingDownload(false);
      console.log("Error fetching data:", error);
    }
  };

  const getSummary = async (groupedData: any) => {
    const summary = groupedData.reduce((acc: any, item: any) => {
      const existingItem = acc.find(
        (el: any) =>
          el.nama_karyawan === item.nama_karyawan && el.lokasi === item.lokasi
      );

      if (existingItem) {
        // Counting different statuses
        switch (item.status) {
          case "Hadir":
            existingItem.hadir++;
            break;
          case "Izin":
            existingItem.izin++;
            break;
          case "Sakit":
            existingItem.sakit++;
            break;
          default:
            break;
        }

        // Counting different keterangan values
        switch (item.keterangan) {
          case "Tanpa Keterangan":
            existingItem.tk++;
            break;
          case "Backup":
            existingItem.backup++;
            break;
          default:
            break;
        }
      } else {
        // New item for a unique combination of nama_karyawan and lokasi
        const newItem = {
          hadir: item.status === "Hadir" ? 1 : 0,
          izin: item.status === "Izin" ? 1 : 0,
          sakit: item.status === "Sakit" ? 1 : 0,
          tk: item.keterangan === "Tanpa Keterangan" ? 1 : 0,
          backup: item.keterangan === "Backup" ? 1 : 0,
          nama_karyawan: item.nama_karyawan,
          lokasi: item.lokasi,
        };
        acc.push(newItem);
      }

      return acc;
    }, []);
    setSummaryList(summary);
    setLoadingDownload(false);
  };

  const onChangeLokasi = (value: number) => {
    setIdLokasi(value);
    lokasiList.map((item: any) => {
      if (item.id == value) {
        setNamaLokasi(item.nama_lokasi);
      }
    });
  };

  const onChangeDate = async (dates: any, dateStrings: string[]) => {
    setStartDate(dateStrings ? dateStrings[0] : formattedDate);
    setEndDate(dateStrings ? dateStrings[1] : formattedDate);
  };

  React.useEffect(() => {
    getAbsensi();
  }, [startDate, endDate, idLokasi]);

  React.useEffect(() => {
    getLokasi();
  }, []);

  const exportToExcel = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Convert workbook to a binary string and create a Blob
    const excelBuffer = XLSX.write(workbook, {
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
      exportToExcel(
        absensiList,
        "absensi_" + namaLokasi + "_" + startDate + " - " + endDate
      );
      exportToExcel(
        summaryList,
        "summary_" + namaLokasi + "_" + startDate + " - " + endDate
      );
    } else {
      error();
    }
  };

  return (
    <>
      {contextHolder}
      <Form layout="vertical" form={form} style={{ maxWidth: 600 }}>
        <Form.Item label="Pilih Rentang Waktu">
          <RangePicker
            defaultValue={[
              dayjs(startDate, dateFormat),
              dayjs(endDate, dateFormat),
            ]}
            format={dateFormat}
            onChange={onChangeDate}
          />
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

export default Download;
