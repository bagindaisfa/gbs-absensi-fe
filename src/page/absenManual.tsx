import {
  Button,
  DatePicker,
  DatePickerProps,
  Form,
  message,
  Radio,
  RadioChangeEvent,
  Select,
} from "antd";
import React, { useState } from "react";
import dayjs from "dayjs";
import foto from "../foto_default.jpeg";

const { Option } = Select;

const AbsenManual: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const karyawanURL = "http://195.35.36.220:3001/karyawanList";
  const shiftURL = "http://195.35.36.220:3001/shiftoption";
  const lokasiURL = "http://195.35.36.220:3001/masterLokasi";
  const dateFormat = "YYYY-MM-DD";
  const [karyawanList, setKaryawanList] = useState([]);
  const [shiftList, setShiftList] = useState([]);
  const [lokasiList, setLokasiList] = useState([]);
  const [idKaryawan, setIdKaryawan] = useState("");
  const [idLokasi, setIdLokasi] = useState("");
  const [idShift, setIdShift] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [status, setStatus] = useState("");
  const [lat, setLat] = useState("");
  const [long, setLong] = useState("");
  const [dateTime, setDateTime] = useState<any>("");
  const [loadingKaryawan, setLoadingKaryawan] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const onChangeKaryawan = (value: any) => {
    setIdKaryawan(value);
    let lokasi = 0;
    karyawanList.map((item: any) => {
      if (item.id === value) {
        setIdLokasi(item.id_lokasi);
        lokasi = item.id_lokasi;
      }
    });
    getShift(lokasi);
  };

  const onChangeStatus = ({ target: { value } }: RadioChangeEvent) => {
    setStatus(value);
  };

  const onChangeShift = (val: any) => {
    setIdShift(val);
  };

  const onChange = (
    value: DatePickerProps["value"],
    dateString: [string, string] | string
  ) => {
    setDateTime(dateString);
  };

  const onOk = (value: DatePickerProps["value"]) => {
    console.log("onOk: ", value);
  };

  const getKaryawan = async () => {
    setLoadingKaryawan(true);
    try {
      const response = await fetch(karyawanURL); // Replace with your API endpoint
      if (!response.ok) {
        setLoadingKaryawan(false);
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setKaryawanList(result.karyawan);
      }
      getLokasi();
    } catch (error) {
      setLoadingKaryawan(false);
      console.log("Error fetching data:", error);
    }
  };

  const getShift = async (idLokasi: any) => {
    try {
      const response = await fetch(shiftURL + "?id_lokasi=" + idLokasi); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setShiftList(result.shift);
        lokasiList.map((item: any) => {
          if (item.id == idLokasi) {
            setLat(item.lat);
            setLong(item.long);
          }
        });
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const getLokasi = async () => {
    try {
      const response = await fetch(lokasiURL); // Replace with your API endpoint
      if (!response.ok) {
        setLoadingKaryawan(false);
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setLokasiList(result.lokasi);
        setLoadingKaryawan(false);
      }
    } catch (error) {
      setLoadingKaryawan(false);
      console.log("Error fetching data:", error);
    }
  };

  const success = (message: any) => {
    messageApi.open({
      type: "success",
      content: message,
    });
  };

  const error = (message: any) => {
    messageApi.open({
      type: "error",
      content: message,
    });
  };

  const submit = async () => {
    setLoadingSubmit(true);
    let hari_izin: any = [];
    if (status === "Izin" || status === "Sakit") {
      await form
        .validateFields()
        .then(async (values) => {
          hari_izin = values.hari_izin.map((item: any) => {
            return dayjs(item.date).format(dateFormat); // Extract date part in "YYYY-MM-DD" format
          });
        })
        .catch((error) => {
          console.log("error get dates :", error);
          hari_izin = [];
        });
    }

    const defaultPhotoData = await fetch(foto).then((res) => res.blob());

    const formData = new FormData();
    formData.append("id_karyawan", idKaryawan);
    formData.append("now", dateTime);
    formData.append("latitude", lat);
    formData.append("longitude", long);
    formData.append("foto", defaultPhotoData);
    formData.append("id_shift", idShift);
    formData.append("id_lokasi", idLokasi);
    formData.append("hari_izin", JSON.stringify(hari_izin));
    if (status === "Izin" || status === "Sakit") {
      formData.append("status", status);
      formData.append("alasan", keterangan);
    } else {
      formData.append("status", status);
      formData.append("alasan", "");
    }

    try {
      const url = "http://195.35.36.220:3001/absensimanual";
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        const errorMessage = errorResponse?.error || "Unknown error occurred.";
        error(errorMessage);
        setLoadingSubmit(false);
      } else {
        // Handle response if needed
        const data = await response.json();
        console.log("Response:", data);
        success("Berhasil disimpan!");
        setLoadingSubmit(false);
      }
    } catch (err) {
      console.error("Error:", err);

      error(err);
      setLoadingSubmit(false);
    }
  };

  React.useEffect(() => {
    getKaryawan();
  }, []);

  return (
    <>
      {contextHolder}
      <Form layout="vertical" form={form} style={{ maxWidth: 600 }}>
        <Form.Item label="Input Absen Manual" name="layout">
          <Radio.Group
            buttonStyle="solid"
            onChange={onChangeStatus}
            value={status}
          >
            <Radio.Button value="Hadir">Hadir</Radio.Button>
            <Radio.Button value="Pulang">Pulang</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item>
          <DatePicker showTime onChange={onChange} onOk={onOk} />
        </Form.Item>
        <Form.Item label="Karyawan">
          <Select
            placeholder="pilih karyawan"
            onChange={onChangeKaryawan}
            allowClear
            showSearch
            loading={loadingKaryawan}
            filterOption={(input, option) =>
              (option?.label ?? "").includes(input)
            }
            filterSort={(optionA: any, optionB: any) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
          >
            {karyawanList?.map((item: any) => {
              return (
                <Option
                  key={item.id}
                  value={item.id}
                  label={`${item.nama} / ${item.nama_lokasi}`}
                >
                  {item.nama} / {item.nama_lokasi}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="idShift"
          rules={[{ required: true, message: "Missing Shift" }]}
        >
          <Select
            placeholder="pilih shift"
            allowClear
            style={{ minWidth: 260 }}
            onChange={onChangeShift}
          >
            {shiftList?.map((shiftItem: any) => {
              return (
                <Option key={shiftItem.id} value={shiftItem.id}>
                  Shift {shiftItem.shift}, {shiftItem.jam_masuk}-
                  {shiftItem.jam_keluar}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            loading={loadingSubmit}
            disabled={
              status === "" ||
              idKaryawan === "" ||
              idShift === "" ||
              idLokasi === "" ||
              lat === "" ||
              long === ""
            }
            onClick={submit}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default AbsenManual;
