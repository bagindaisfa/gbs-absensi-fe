import React, { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Table,
  Upload,
} from "antd";
import * as XLSX from "xlsx";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

interface DataType {
  id: number;
  nama_lokasi: string;
  shift: number;
  jam_masuk: string;
  jam_keluar: string;
  lat: string;
  long: string;
  toleransi: number;
}

const Lokasi: React.FC = () => {
  dayjs.extend(customParseFormat);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lokasiList, setLokasiList] = useState([]);
  const [lokasiOption, setLokasiOption] = useState([]);
  const [idLokasi, setIdLokasi] = useState(0);
  const [namaLokasi, setNamaLokasi] = useState("");
  const [toleransi, setToleransi] = useState(0);
  const [lat, setLat] = useState("");
  const [long, setLong] = useState("");
  const [edit, setEdit] = useState(false);
  const lokasiURL = "https://internal.gbssecurindo.co.id/lokasi";
  const columns: ColumnsType<DataType> = [
    {
      title: "Lokasi",
      dataIndex: "nama_lokasi",
      key: "nama_lokasi",
      filters: lokasiOption,
      filterMode: "tree",
      filterSearch: true,
      onFilter: (val: any, record) => record.nama_lokasi.startsWith(val),
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
    },
    {
      title: "Jam Masuk",
      dataIndex: "jam_masuk",
      key: "jam_masuk",
    },
    {
      title: "Jam Keluar",
      dataIndex: "jam_keluar",
      key: "jam_keluar",
    },
    {
      title: "Koordinat",
      key: "koordinat",
      render: (_, record) => {
        return (
          record.lat && (
            <a
              href={`https://maps.google.com/maps?q=@${record.lat},${record.long}`}
              style={{ textDecoration: "none" }}
              target="_blank"
            >
              {record.lat}, {record.long}
            </a>
          )
        );
      },
    },
    {
      title: "Toleransi Keterlambatan (menit)",
      dataIndex: "toleransi",
      key: "toleransi",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          size="middle"
          onClick={() => {
            setIdLokasi(record.id);
            setNamaLokasi(record.nama_lokasi);
            setToleransi(record.toleransi);
            setLat(record.lat);
            setLong(record.long);
            showModal();
            setEdit(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];
  React.useEffect(() => {
    getLokasi();
  }, []);

  const getLokasi = async () => {
    try {
      const response = await fetch(lokasiURL); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setLokasiList(result.lokasi);
        const option = result.lokasi.map((item: any) => {
          return {
            text: item.nama_lokasi,
            value: item.nama_lokasi,
          };
        });
        setLokasiOption(option);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Berhasil disimpan!",
    });
  };

  const error = () => {
    messageApi.open({
      type: "error",
      content: "Gagal Menyimpan!",
    });
  };

  const reset = () => {
    setNamaLokasi("");
    setToleransi(0);
    setIdLokasi(0);
    setLat("");
    setLong("");
    setIsModalOpen(false);
    getLokasi();
    setEdit(false);
  };

  const submitLokasi = async () => {
    try {
      if (edit) {
        const url = `${lokasiURL}?id=${idLokasi}&nama_lokasi=${namaLokasi}&toleransi=${toleransi}&lat=${lat}&long=${long}`;
        const response = await fetch(url, { method: "PUT" });

        if (!response.ok) {
          error();
          setEdit(false);
          throw new Error("Network response was not ok.");
        } else {
          const data = await response.json();
          success();
          reset();
        }
      } else {
        const url = `${lokasiURL}?nama_lokasi=${namaLokasi}&toleransi=${toleransi}&lat=${lat}&long=${long}`;
        const response = await fetch(url, { method: "POST" });

        if (!response.ok) {
          error();
          setEdit(false);
          throw new Error("Network response was not ok.");
        } else {
          const data = await response.json();
          success();
          reset();
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setIsModalOpen(false);
      error();
      setEdit(false);
    }
  };

  const onChangeKoordinat = (val: any) => {
    const latlong = val.target.value;
    const [latitude, longitude] = latlong.split(", ");
    if (
      !(
        -90 <= latitude &&
        latitude <= 90 &&
        -180 <= longitude &&
        longitude <= 180
      )
    ) {
      alert("Koordinat salah, cek ulang!!");
    } else {
      setLat(latitude);
      setLong(longitude);
    }
  };

  const onChangeToleransi = (val: any) => {
    setToleransi(val);
  };

  const onChangeNamaLokasi = (val: any) => {
    setNamaLokasi(val.target.value);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    submitLokasi();
  };

  const handleCancel = () => {
    reset();
  };

  const handleUpload = async (file: any) => {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Assuming only one sheet in the Excel file
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert sheet data to JSON format
      const jsonData: any = XLSX.utils.sheet_to_json(sheet);
      console.log(jsonData); // Log the parsed data

      for (let i = 0; i < jsonData.length; i++) {
        const url = `${lokasiURL}?nama_lokasi=${jsonData[i].nama_lokasi}&toleransi=${jsonData[i].toleransi}&lat=${jsonData[i].lat}&long=${jsonData[i].long}`;
        const response = await fetch(url, { method: "POST" });

        if (!response.ok) {
          error();
          setEdit(false);
          throw new Error("Network response was not ok.");
        } else {
          const data = await response.json();
          success();
        }
      }
    };

    reader.readAsArrayBuffer(file);
    return false;
  };

  const props = {
    accept: ".xlsx",
    beforeUpload: (file: any) => {
      const isXLSX =
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      if (!isXLSX) {
        message.error("You can only upload XLSX files!");
      } else {
        handleUpload(file);
      }
      return false;
    },
  };

  return (
    <>
      {contextHolder}
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            onClick={showModal}
            style={{ marginRight: 20 }}
          >
            Tambah Lokasi
          </Button>
          <Upload {...props}>
            <Button icon={<UploadOutlined />} type="primary">
              Import Lokasi
            </Button>
          </Upload>
        </div>
        <Table columns={columns} dataSource={lokasiList} />
      </div>
      <Modal
        title="Tambah Lokasi"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form layout="vertical" form={form} style={{ maxWidth: 600 }}>
          <Form.Item label="Nama Lokasi">
            <Input
              placeholder="nama lokasi"
              onChange={onChangeNamaLokasi}
              value={namaLokasi}
            />
          </Form.Item>
          <Form.Item label="Koordinat">
            <Input
              placeholder="koordinat"
              onChange={onChangeKoordinat}
              value={lat === "" ? "" : lat + ", " + long}
            />
          </Form.Item>
          <Form.Item label="Toleransi Keterlambatan (menit)">
            <InputNumber
              placeholder="toleransi"
              min={0}
              onChange={onChangeToleransi}
              value={toleransi}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Lokasi;
