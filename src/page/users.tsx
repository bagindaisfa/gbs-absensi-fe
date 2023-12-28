import React, { useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import * as XLSX from "xlsx";

const { Option } = Select;

interface DataType {
  id: number;
  username: string;
  id_karyawan: number;
  password: string;
}

const Users: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [idUser, setIdUser] = useState(0);
  const [idKaryawan, setIdKaryawan] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [karyawanList, setKaryawanList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const karyawanURL = "https://internal.gbssecurindo.co.id/karyawanList";
  const usersURL = "https://internal.gbssecurindo.co.id/users";

  const columns: ColumnsType<DataType> = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Id karyawan",
      dataIndex: "id_karyawan",
      key: "id_karyawan",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          size="middle"
          onClick={() => {
            setIdUser(record.id);
            setIdKaryawan(record.id_karyawan);
            setUsername(record.username);
            setPassword(record.password);
            showModal();
            setEdit(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

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

  const getKaryawan = async () => {
    try {
      const response = await fetch(karyawanURL); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setKaryawanList(result.karyawan);
        console.log("karyawan :", result);
      }
      getUsers();
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const getUsers = async () => {
    try {
      const response = await fetch(usersURL); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setUsersList(result.users);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const onChangeNama = (val: any) => {
    setUsername(val.target.value);
  };
  const onChangePassword = (val: any) => {
    setPassword(val.target.value);
  };
  const onChangeLokasi = (value: number) => {
    setIdKaryawan(value);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const reset = () => {
    setUsername("");
    setPassword("");
    setIdUser(0);
    setIdKaryawan(0);
    setIsModalOpen(false);
    getKaryawan();
    setEdit(false);
  };

  const handleOk = async () => {
    try {
      if (edit) {
        const url = `https://internal.gbssecurindo.co.id/users?id=${idUser}&username=${username}&password=${password}&id_karyawan=${idKaryawan}`;
        const response = await fetch(url, { method: "PUT" });

        if (!response.ok) {
          error();
          setEdit(false);
          throw new Error("Network response was not ok.");
        } else {
          const data = await response.json();
          console.log("Response:", data);
          success();
          reset();
        }
      } else {
        const url = `https://internal.gbssecurindo.co.id/users?username=${username}&password=${password}&id_karyawan=${idKaryawan}`;
        const response = await fetch(url, { method: "POST" });

        if (!response.ok) {
          error();
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
      error();
      setEdit(false);
    }
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
        const url = `https://internal.gbssecurindo.co.id/users?username=${
          jsonData[i].username
        }&password=${jsonData[i].password}&id_karyawan=${1}`;
        const response = await fetch(url, { method: "POST" });

        if (!response.ok) {
          error();
          setEdit(false);
          throw new Error("Network response was not ok.");
        } else {
          const data = await response.json();
          console.log("Response:", data);
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

  React.useEffect(() => {
    getKaryawan();
  }, []);

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
            Tambah Pengguna
          </Button>
          <Upload {...props}>
            <Button icon={<UploadOutlined />} type="primary">
              Import Pengguna
            </Button>
          </Upload>
        </div>
        <Table columns={columns} dataSource={usersList} />
      </div>
      <Modal
        title="Tambah Pengguna"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form layout="vertical" form={form} style={{ maxWidth: 600 }}>
          <Form.Item label="Username">
            <Input
              placeholder="username"
              onChange={onChangeNama}
              value={username}
            />
          </Form.Item>
          <Form.Item label="Password">
            <Input
              placeholder="password"
              onChange={onChangePassword}
              type="password"
              value={password}
            />
          </Form.Item>
          <Form.Item label="Karyawan">
            <Select
              placeholder="pilih lokasi karyawan"
              onChange={onChangeLokasi}
              allowClear
              value={idKaryawan}
              showSearch
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
        </Form>
      </Modal>
    </>
  );
};

export default Users;