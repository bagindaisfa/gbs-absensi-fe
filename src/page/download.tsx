import React, { useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  message,
  Select,
  notification,
  NotificationArgsProps,
} from "antd";
import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";
import dayjs from "dayjs";
import { saveAs } from "file-saver";

const { RangePicker } = DatePicker;
const { Option } = Select;
type NotificationType = "success" | "info";
type NotificationPlacement = NotificationArgsProps["placement"];

const Download: React.FC = () => {
  const [form] = Form.useForm();
  const currentDate = new Date();
  const [messageApi, contextHolder] = message.useMessage();
  const [api, contextHolderNotif] = notification.useNotification();
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
  const absensiURL = "http://195.35.36.220:3001/absensibylokasi";
  const absensiFotoURL = "http://195.35.36.220:3001/absensiFotobylokasi";
  const lokasiURL = "http://195.35.36.220:3001/masterlokasi";

  const openNotificationWithIcon = (
    placement: NotificationPlacement,
    type: NotificationType,
    msg: string,
    desc: string
  ) => {
    api[type]({
      message: msg,
      description: desc,
      placement,
    });
  };

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
    if (idLokasi > 0) {
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
          const formattedAbsensiList = result.absensi.map((item: any) => {
            const originalDate = new Date(item.jam_masuk);
            const originalDate1 = new Date(item.jam_keluar);
            const originalDate2 = new Date(item.tanggal);

            const formattedDate = `${originalDate.getFullYear()}-${padZero(
              originalDate.getMonth() + 1
            )}-${padZero(originalDate.getDate())} ${padZero(
              originalDate.getHours()
            )}:${padZero(originalDate.getMinutes())}:${padZero(
              originalDate.getSeconds()
            )}`;
            const formattedDate1 = `${originalDate1.getFullYear()}-${padZero(
              originalDate1.getMonth() + 1
            )}-${padZero(originalDate1.getDate())} ${padZero(
              originalDate1.getHours()
            )}:${padZero(originalDate1.getMinutes())}:${padZero(
              originalDate1.getSeconds()
            )}`;
            const formattedDate2 = `${originalDate2.getFullYear()}-${padZero(
              originalDate2.getMonth() + 1
            )}-${padZero(originalDate2.getDate())} ${padZero(
              originalDate2.getHours()
            )}:${padZero(originalDate2.getMinutes())}:${padZero(
              originalDate2.getSeconds()
            )}`;

            function padZero(num: any) {
              return num.toString().padStart(2, "0");
            }

            // Create a new object with the modified values
            return {
              ...item,
              foto_datang: item.id_datang
                ? `http://195.35.36.220:3001/downloads/photo_${item.id_datang}.jpeg`
                : "",
              foto_pulang: item.id_pulang
                ? `http://195.35.36.220:3001/downloads/photo_${item.id_pulang}.jpeg`
                : "",
              jam_masuk: item.jam_masuk ? formattedDate : "",
              jam_keluar: item.jam_keluar ? formattedDate1 : "",
              tanggal: item.tanggal ? formattedDate2 : "",
            };
          });

          setAbsensiList(formattedAbsensiList);

          await getSummary(formattedAbsensiList);
        }
      } catch (error) {
        setLoadingDownload(false);
        console.log("Error fetching data:", error);
      }
    }
  };

  const getAbsensiFoto = async () => {
    if (idLokasi > 0) {
      setLoadingDownload(true);
      try {
        const response = await fetch(
          absensiFotoURL +
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
        setLoadingDownload(false);
      } catch (error) {
        setLoadingDownload(false);
        console.log("Error fetching data:", error);
      }
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
          default:
            break;
        }

        // Counting different keterangan values

        switch (item.shift) {
          case "Backup":
            existingItem.backup++;
            break;
          default:
            break;
        }

        switch (item.keterangan_lain) {
          case "Tanpa Keterangan":
            existingItem.tk++;
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
      } else {
        // New item for a unique combination of nama_karyawan and lokasi
        const newItem = {
          hadir: item.status === "Hadir" ? 1 : 0,
          izin: item.status === "Izin" ? 1 : 0,
          sakit: item.status === "Sakit" ? 1 : 0,
          tk:
            item.keterangan_kedatangan === "Tanpa Keterangan" &&
            item.keterangan_pulang === "Tanpa Keterangan"
              ? 1
              : 0,
          backup: item.shift === "Backup" ? 1 : 0,
          nama_karyawan: item.nama_karyawan,
          lokasi: item.lokasi,
        };
        acc.push(newItem);
      }

      return acc;
    }, []);
    setSummaryList(summary);
    await getAbsensiFoto();
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

  const exportToExcel = async (data: any[], filename: string) => {
    setLoadingDownload(true);
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
    openNotificationWithIcon(
      "bottomRight",
      "success",
      "Download",
      `${filename}.xlsx berhasil di-download`
    );
  };

  const createExcelWithImage = () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet1");
    sheet.columns = [
      { header: "ID Karyawan", key: "id_karyawan", width: 10 },
      { header: "Foto Datang", key: "foto_datang", width: 30 },
      { header: "Foto Pulang", key: "foto_pulang", width: 30 },
      { header: "Lokasi", key: "lokasi", width: 32 },
      { header: "Nama", key: "nama_karyawan", width: 35 },
      { header: "Shift", key: "shift", width: 10 },
      { header: "Hari", key: "hari", width: 20 },
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "Status", key: "status", width: 10 },
      { header: "Datang", key: "keterangan_kedatangan", width: 35 },
      { header: "Pulang", key: "keterangan_pulang", width: 35 },
      { header: "Keterangan", key: "keterangan_lain", width: 35 },
      { header: "Jam Masuk", key: "jam_masuk", width: 20 },
      { header: "Jam Keluar", key: "jam_keluar", width: 20 },
      { header: "Lampiran", key: "lampiran", width: 35 },
      { header: "Alasan", key: "alasan", width: 35 },
    ];

    if (absensiList.length > 0) {
      const fetchImagePromises = absensiList.map(
        async (item: any, index: number) => {
          sheet.getRow(index + 1).height = 100;
          sheet.addRow({
            id_karyawan: item.id_karyawan,
            lokasi: item.lokasi,
            nama_karyawan: item.nama_karyawan,
            shift: item.shift,
            hari: item.hari,
            tanggal: item.tanggal,
            status: item.status,
            keterangan_kedatangan: item.keterangan_kedatangan,
            keterangan_pulang: item.keterangan_pulang,
            keterangan_lain: item.keterangan_lain,
            jam_masuk: item.jam_masuk,
            jam_keluar: item.jam_keluar,
            lampiran: item.lampiran,
            alasan: item.alasan,
          });
          // Fetch image data as array buffer
          const fetchData = async (url: string) => {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            return response.arrayBuffer();
          };

          // Fetch and add the image for foto_datang
          try {
            const imageDataDatang = await fetchData(item.foto_datang);
            const imageIdDatang = workbook.addImage({
              buffer: imageDataDatang,
              extension: "jpeg",
            });

            sheet.addImage(imageIdDatang, {
              tl: { col: 1, row: index + 1 },
              ext: { width: 100, height: 150 },
            });
          } catch (error) {
            console.error("Error fetching or adding image:", error);
          }

          // Fetch and add the image for foto_pulang
          try {
            const imageDataPulang = await fetchData(item.foto_pulang);
            const imageIdPulang = workbook.addImage({
              buffer: imageDataPulang,
              extension: "jpeg",
            });

            sheet.addImage(imageIdPulang, {
              tl: { col: 2, row: index + 1 },
              ext: { width: 100, height: 150 },
            });
          } catch (error) {
            console.error("Error fetching or adding image:", error);
          }
        }
      );

      Promise.all(fetchImagePromises)
        .then(() => {
          // Save the workbook
          return workbook.xlsx.writeBuffer();
        })
        .then((buffer) => {
          const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          saveAs(blob, `absensi_${namaLokasi}_${startDate} - ${endDate}.xlsx`);
          openNotificationWithIcon(
            "bottomRight",
            "success",
            "Download",
            `absensi_${namaLokasi}_${startDate} - ${endDate}.xlsx berhasil di-download`
          );
          setLoadingDownload(false);
        })
        .catch((error) => {
          console.error("Error creating workbook buffer:", error);
        });
    }
  };

  const error = () => {
    messageApi.open({
      type: "error",
      content: "Pilih Lokasi!",
    });
  };

  const handleExportClick = () => {
    if (idLokasi != 0) {
      openNotificationWithIcon(
        "bottomRight",
        "info",
        "Download",
        "Sedang diproses!"
      );
      createExcelWithImage();
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
      {contextHolderNotif}
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
