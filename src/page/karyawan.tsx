import React, { useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  DatePicker,
  Table,
  Tag,
  Upload,
  Space,
  InputRef,
} from "antd";
import type { ColumnType, ColumnsType } from "antd/es/table";
import {
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { SearchOutlined } from "@ant-design/icons";
import { FilterConfirmProps } from "antd/es/table/interface";
import Highlighter from "react-highlight-words";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface DataType {
  id: number;
  nama: string;
  id_lokasi: number;
  id_shift: number;
  nama_lokasi: string;
}
type DataIndex = keyof DataType;

const Karyawan: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const dateFormat = "YYYY-MM-DD";
  const [searchText, setSearchText] = useState("");
  const searchInput = useRef<InputRef>(null);
  const [searchedColumn, setSearchedColumn] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idKaryawan, setIdKaryawan] = useState(0);
  const [idLokasi, setIdLokasi] = useState(0);
  const [namaKaryawan, setNamaKaryawan] = useState("");
  const [karyawanList, setKaryawanList] = useState<any>([]);
  const [lokasiList, setLokasiList] = useState([]);
  const [shiftList, setShiftList] = useState([]);
  const [lokasiOption, setLokasiOption] = useState([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [shiftDeletedData, setShiftDeletedData] = useState<Array<any>>([]);
  const [edit, setEdit] = useState(false);
  const karyawanURL = "https://internal.gbssecurindo.co.id/karyawanList";
  const karyawanSubmitURL = "https://internal.gbssecurindo.co.id/karyawan";
  const shiftKaryawanURL = "https://internal.gbssecurindo.co.id/shiftkaryawan";
  const lokasiURL = "https://internal.gbssecurindo.co.id/masterLokasi";
  const shiftURL = "https://internal.gbssecurindo.co.id/shiftoption";

  const getKaryawan = async () => {
    try {
      const response = await fetch(karyawanURL); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setKaryawanList(result.karyawan);
      }
      getLokasi();
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const getShiftKaryawan = async (id_karyawan: number, id_lokasi: number) => {
    setLoadingEdit(true);
    try {
      const response = await fetch(
        shiftKaryawanURL +
          "?id_lokasi=" +
          id_lokasi +
          "&id_karyawan=" +
          id_karyawan
      ); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        const shift_data = result.shiftkaryawan.map((item: any) => {
          return {
            id: item.id_shift,
            dateRange: [dayjs(item.start_date), dayjs(item.end_date)],
            id_shift_karyawan: item.id,
          };
        });

        form.setFieldsValue({ shift: shift_data });
        showModal();
        setEdit(true);
      }
      getLokasi();
    } catch (error) {
      console.log("Error fetching data:", error);
      setLoadingEdit(false);
    }
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
        const option = result.lokasi.map((item: any) => {
          return {
            text: item.nama_lokasi,
            value: item.nama_lokasi,
          };
        });
        setLokasiOption(option);
        setLoadingEdit(false);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const getShift = async () => {
    if (idLokasi != 0) {
      try {
        const response = await fetch(shiftURL + "?id_lokasi=" + idLokasi); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }

        const result = await response.json();
        if (result) {
          setShiftList(result.shift);
        }
      } catch (error) {
        console.log("Error fetching data:", error);
      }
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

  const onChangeNama = (val: any) => {
    setNamaKaryawan(val.target.value);
  };

  const onChangeLokasi = (value: number) => {
    setIdLokasi(value);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleRemove = (name: number) => {
    form.validateFields().then(async (values) => {
      // Remove the item from formValues state
      const filteredData = values.shift.splice(name, 1);
      const deletedItem = filteredData.map((item: any) => {
        return {
          ...item,
          status: "deleted",
        };
      });

      setShiftDeletedData([...shiftDeletedData, ...deletedItem]);
      form.setFieldsValue({ shift: values.shift });
    });
  };

  const handleOk = async () => {
    form
      .validateFields()
      .then(async (values) => {
        const formated_array = values.shift.map((item: any) => {
          if (item.id_shift_karyawan) {
            return {
              id: item.id,
              dateRange: item.dateRange.map((date: any) => {
                return dayjs(date).format(dateFormat); // Extract date part in "YYYY-MM-DD" format
              }),
              id_shift_karyawan: item.id_shift_karyawan,
            };
          } else {
            return {
              id: item.id,
              dateRange: item.dateRange.map((date: any) => {
                return dayjs(date).format(dateFormat); // Extract date part in "YYYY-MM-DD" format
              }),
              status: item.status ?? "new",
            };
          }
        });

        if (idLokasi != 0 && namaKaryawan !== "") {
          try {
            if (edit) {
              const url = `${karyawanSubmitURL}?id=${idKaryawan}&nama=${namaKaryawan}&id_lokasi=${idLokasi}&shift=${JSON.stringify(
                [...formated_array, ...shiftDeletedData]
              )}`;
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
              const url = `${karyawanSubmitURL}?nama=${namaKaryawan}&id_lokasi=${idLokasi}&shift=${JSON.stringify(
                formated_array
              )}`;
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
        } else {
          error("Isi Nama Karyawan dan pilih Lokasi!");
        }
      })
      .catch((errorInfo) => {
        console.error("Validation failed:", errorInfo);
      });
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
        const url = `${karyawanSubmitURL}?nama=${
          jsonData[i].nama
        }&id_lokasi=${1}&shift=${JSON.stringify([])}`;
        const response = await fetch(url, { method: "POST" });
        if (!response.ok) {
          error("Gagal Menyimpan!");
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

  const handleCancel = () => {
    reset();
  };

  const reset = () => {
    setIdLokasi(0);
    setNamaKaryawan("");
    setIdLokasi(0);
    setShiftDeletedData([]);
    setShiftList([]);
    setIsModalOpen(false);
    getKaryawan();
    setEdit(false);
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex
  ): ColumnType<DataType> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const columns: ColumnsType<DataType> = [
    {
      title: "Nama",
      dataIndex: "nama",
      key: "nama",
      ...getColumnSearchProps("nama"),
    },
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          size="middle"
          onClick={() => {
            setIdKaryawan(record.id);
            setIdLokasi(record.id_lokasi);
            setNamaKaryawan(record.nama);
            getShiftKaryawan(record.id, record.id_lokasi);
          }}
          loading={loadingEdit}
        >
          Edit
        </Button>
      ),
    },
  ];

  React.useEffect(() => {
    getKaryawan();
  }, []);

  React.useEffect(() => {
    getShift();
  }, [idLokasi]);

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
            Tambah Karyawan
          </Button>
          <Upload {...props}>
            <Button icon={<UploadOutlined />} type="primary">
              Import Karyawan
            </Button>
          </Upload>
        </div>
        <Table columns={columns} dataSource={karyawanList} />
      </div>
      <Modal
        title="Tambah Karyawan"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form layout="vertical" form={form} style={{ maxWidth: 600 }}>
          <Form.Item label="Nama Karyawan">
            <Input
              placeholder="nama"
              onChange={onChangeNama}
              value={namaKaryawan}
            />
          </Form.Item>
          <Form.Item label="Lokasi Kerja">
            <Select
              placeholder="pilih lokasi"
              onChange={onChangeLokasi}
              allowClear
              value={idLokasi}
              disabled={edit}
            >
              {lokasiList?.map((item: any) => {
                return <Option value={item.id}>{item.nama_lokasi}</Option>;
              })}
            </Select>
          </Form.Item>

          <Form.List name="shift">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "id_shift_karyawan"]}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "dateRange"]}
                      rules={[
                        { required: true, message: "Missing Date Range" },
                      ]}
                    >
                      <RangePicker
                        style={{ minWidth: 250 }}
                        format={dateFormat}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "id"]}
                      rules={[
                        { required: true, message: "Missing Lokasi Kerja" },
                      ]}
                    >
                      <Select
                        placeholder="pilih shift"
                        allowClear
                        style={{ minWidth: 260 }}
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
                    <MinusCircleOutlined
                      onClick={() => {
                        handleRemove(name);
                      }}
                    />
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Tambah shift
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
};

export default Karyawan;
