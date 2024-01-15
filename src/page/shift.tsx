import React, { useState } from "react";
import {
  Button,
  Form,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
  TimePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
const { Option } = Select;

interface DataType {
  id: number;
  id_lokasi: number;
  nama_lokasi: string;
  shift: number;
  jam_masuk: string;
  jam_keluar: string;
}

const Lokasi: React.FC = () => {
  dayjs.extend(customParseFormat);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lokasiList, setLokasiList] = useState([]);
  const [shiftList, setShiftList] = useState([]);
  const [idLokasi, setIdLokasi] = useState(0);
  const [idShift, setIdShift] = useState(0);
  const [shift, setShift] = useState(0);
  const [jamMasuk, setJamMasuk] = useState("00:00:00");
  const [jamKeluar, setJamKeluar] = useState("00:00:00");
  const [edit, setEdit] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const lokasiURL = "https://internal.gbssecurindo.co.id/masterLokasi";
  const shiftURL = "https://internal.gbssecurindo.co.id/shift";
  const columns: ColumnsType<DataType> = [
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
    },
    {
      title: "Lokasi",
      dataIndex: "nama_lokasi",
      key: "nama_lokasi",
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          size="middle"
          onClick={() => {
            setIdShift(record.id);
            setIdLokasi(record.id_lokasi);
            setShift(record.shift);
            setJamMasuk(record.jam_masuk);
            setJamKeluar(record.jam_keluar);
            showModal();
            setEdit(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];
  const config = {
    rules: [
      {
        type: "object" as const,
        required: true,
        message: "Please select time!",
      },
    ],
  };

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
        getShift();
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const getShift = async () => {
    setLoadingTable(true);
    try {
      const response = await fetch(shiftURL); // Replace with your API endpoint
      if (!response.ok) {
        setLoadingTable(false);
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setShiftList(result.shift);
        setLoadingTable(false);
      }
    } catch (error) {
      setLoadingTable(false);
      console.log("Error fetching data:", error);
    }
  };

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Berhasil disimpan!",
    });
  };

  const error = (message: string) => {
    messageApi.open({
      type: "error",
      content: message,
    });
  };

  const reset = () => {
    setIdLokasi(0);
    setIdShift(0);
    setShift(0);
    setJamMasuk("00:00:00");
    setJamKeluar("00:00:00");
    setIsModalOpen(false);
    getLokasi();
    setEdit(false);
  };

  const submitLokasi = async () => {
    try {
      if (edit) {
        const url = `${shiftURL}?id=${idShift}&id_lokasi=${idLokasi}&shift=${shift}&jam_masuk=${
          shift == 0 ? "" : jamMasuk
        }&jam_keluar=${shift == 0 ? "" : jamKeluar}`;
        const response = await fetch(url, { method: "PUT" });
        if (!response.ok) {
          error("Gagal Menyimpan!");
          setEdit(false);
          throw new Error("Network response was not ok.");
        } else {
          const data = await response.json();
          console.log("Response:", data);
          success();
          reset();
        }
      } else {
        const url = `${shiftURL}?id_lokasi=${idLokasi}&shift=${shift}&jam_masuk=${
          shift == 0 ? "" : jamMasuk
        }&jam_keluar=${shift == 0 ? "" : jamKeluar}`;
        const response = await fetch(url, { method: "POST" });
        if (!response.ok) {
          error("Gagal Menyimpan!");
          setEdit(false);
          throw new Error("Network response was not ok.");
        } else {
          const data = await response.json();
          console.log("Response:", data);

          success();
          reset();
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setIsModalOpen(false);
      error("Gagal Menyimpan!");
      setEdit(false);
    }
  };

  const onChangeLokasi = (value: number) => {
    setIdLokasi(value);
  };

  const onChangeShift = (value: any) => {
    setShift(value);
  };

  const onChangeJamMasuk = (time: any, timeString: string) => {
    setJamMasuk(timeString);
  };

  const onChangeJamKeluar = (time: any, timeString: string) => {
    setJamKeluar(timeString);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    if (idLokasi != 0) {
      submitLokasi();
    } else {
      error("Pilih Lokasi!");
    }
  };

  const handleCancel = () => {
    reset();
  };

  return (
    <>
      {contextHolder}
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={showModal}>
            Tambah Shift
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={shiftList}
          loading={loadingTable}
        />
      </div>
      <Modal
        title="Tambah Shift"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form layout="vertical" form={form} style={{ maxWidth: 600 }}>
          <Form.Item label="Lokasi">
            <Select
              placeholder="pilih lokasi"
              onChange={onChangeLokasi}
              allowClear
              value={idLokasi}
            >
              {lokasiList?.map((item: any) => {
                return <Option value={item.id}>{item.nama_lokasi}</Option>;
              })}
            </Select>
          </Form.Item>
          <Form.Item label="Shift">
            <InputNumber
              placeholder="Shift"
              min={0}
              style={{ width: 460 }}
              onChange={onChangeShift}
              value={shift}
            />
          </Form.Item>
          <Form.Item {...config} label="Jam Masuk">
            <TimePicker
              placeholder="Jam masuk"
              style={{ minWidth: 460 }}
              onChange={onChangeJamMasuk}
              value={dayjs(jamMasuk, "HH:mm:ss")}
              defaultOpenValue={dayjs(jamMasuk, "HH:mm:ss")}
            />
          </Form.Item>
          <Form.Item {...config} label="Jam Keluar">
            <TimePicker
              placeholder="Jam keluar"
              style={{ minWidth: 460 }}
              onChange={onChangeJamKeluar}
              value={dayjs(jamKeluar, "HH:mm:ss")}
              defaultOpenValue={dayjs(jamKeluar, "HH:mm:ss")}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Lokasi;
