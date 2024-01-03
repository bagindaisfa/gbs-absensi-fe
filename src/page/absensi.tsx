import React, { useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Input,
  InputRef,
  Space,
  Table,
  Tag,
  Image,
} from "antd";
import type { ColumnType, ColumnsType } from "antd/es/table";
import type { FilterConfirmProps } from "antd/es/table/interface";
import Highlighter from "react-highlight-words";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface DataType {
  //   tags: string[];
  id: number;
  foto: any;
  lampiran: any;
  lokasi: string;
  nama: string;
  shift: number;
  day_name: string;
  tanggal_range: string;
  timestamp: string;
  status: string;
  keterangan: string;
  lat: string;
  long: string;
  alasan: string;
}

type DataIndex = keyof DataType;
const { RangePicker } = DatePicker;

const Absensi: React.FC = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 as months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  const [startDate, setStartDate] = useState(formattedDate);
  const [endDate, setEndDate] = useState(formattedDate);
  const [loadingTable, setLoadingTable] = useState(false);
  const absensiURL = "https://internal.gbssecurindo.co.id/absensi";
  const lokasiURL = "https://internal.gbssecurindo.co.id/masterLokasi";
  const [absensiList, setAbsensiList] = useState([]);
  const [lokasiOption, setLokasiOption] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const dateFormat = "YYYY-MM-DD";
  const [imageSrcList, setImageSrcList] = useState<{ [key: string]: string }>(
    {}
  );
  const [lampiranSrcList, setlampiranSrcList] = useState<{
    [key: string]: string;
  }>({});

  const readBlobAsDataURL = (blobData: any, recordId: any) => {
    const byteArray = new Uint8Array(blobData.data); // Convert Buffer to Uint8Array
    const blob = new Blob([byteArray], { type: "image/jpeg" }); // Create Blob

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setImageSrcList((prevImageSrcList) => ({
        ...prevImageSrcList,
        [recordId]: fileReader.result,
      }));
    };

    fileReader.readAsDataURL(blob); // Read Blob as Data URL
  };

  const readBlobLampiranAsDataURL = (blobData: any, recordId: any) => {
    const byteArray = new Uint8Array(blobData.data); // Convert Buffer to Uint8Array
    const blob = new Blob([byteArray], { type: "image/jpeg" }); // Create Blob

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setlampiranSrcList((prevImageSrcList) => ({
        ...prevImageSrcList,
        [recordId]: fileReader.result,
      }));
    };

    fileReader.readAsDataURL(blob); // Read Blob as Data URL
  };

  const onChangeDate = async (dates: any, dateStrings: string[]) => {
    setStartDate(dateStrings ? dateStrings[0] : formattedDate);
    setEndDate(dateStrings ? dateStrings[1] : formattedDate);
  };

  const getAbsensi = async () => {
    setLoadingTable(true);
    try {
      const response = await fetch(
        absensiURL + "?start_date=" + startDate + "&end_date=" + endDate
      ); // Replace with your API endpoint
      if (!response.ok) {
        setLoadingTable(false);
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        setAbsensiList(result.absensi);
      }
      getLokasi();
    } catch (error) {
      console.log("Error fetching data:", error);
      setLoadingTable(false);
    }
  };

  const getLokasi = async () => {
    try {
      const response = await fetch(lokasiURL); // Replace with your API endpoint
      if (!response.ok) {
        setLoadingTable(false);
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result) {
        const option = result.lokasi.map((item: any) => {
          return {
            text: item.nama_lokasi,
            value: item.nama_lokasi,
          };
        });
        setLokasiOption(option);
        setLoadingTable(false);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
      setLoadingTable(false);
    }
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
      title: "Foto",
      dataIndex: "foto",
      key: "foto",
      render: (_, record) => {
        if (!imageSrcList[record.id] && record.foto) {
          readBlobAsDataURL(record.foto, record.id);
        }

        return (
          imageSrcList[record.id] && (
            <Image
              src={imageSrcList[record.id]}
              alt="Blob Image"
              style={{ width: 100 }}
            />
          )
        );
      },
    },

    {
      title: "Lokasi",
      dataIndex: "lokasi",
      key: "lokasi",
      filters: lokasiOption,
      filterMode: "tree",
      filterSearch: true,
      onFilter: (val: any, record) => record.lokasi.startsWith(val),
    },
    {
      title: "Nama Karyawan",
      dataIndex: "nama",
      key: "nama",
      ...getColumnSearchProps("nama"),
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
    },
    {
      title: "Hari",
      dataIndex: "day_name",
      key: "day_name",
    },
    {
      title: "Tanggal",
      dataIndex: "tanggal_range",
      key: "tanggal_range",
    },
    {
      title: "Absen",
      dataIndex: "timestamp",
      key: "timestamp",
    },
    {
      title: "Lokasi",
      dataIndex: "lokasi_latlong",
      key: "lokasi_latlong",
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
      title: "status",
      key: "status",
      dataIndex: "status",
      render: (_, record) => (
        <Tag
          color={
            record.status === "Tidak Hadir"
              ? "volcano"
              : record.status === "Izin" || record.status === "Sakit"
              ? "yellow"
              : record.status === "Libur"
              ? "blue"
              : "green"
          }
        >
          {record.status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Keterangan",
      dataIndex: "keterangan",
      key: "keterangan",
      render: (_, record) => {
        const ket =
          record.alasan && record.alasan !== ""
            ? record.keterangan + ", " + record.alasan
            : record.keterangan;
        return <span>{ket}</span>;
      },
    },
    {
      title: "Lampiran",
      dataIndex: "lampiran",
      key: "lampiran",
      render: (_, record) => {
        if (!lampiranSrcList[record.id] && record.lampiran) {
          readBlobLampiranAsDataURL(record.lampiran, record.id);
        }

        return (
          lampiranSrcList[record.id] && (
            <Image
              src={lampiranSrcList[record.id]}
              alt="Blob Image"
              style={{ width: 100 }}
            />
          )
        );
      },
    },
  ];

  React.useEffect(() => {
    getAbsensi();
  }, [startDate, endDate]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={absensiList}
        title={() => (
          <RangePicker
            defaultValue={[
              dayjs(startDate, dateFormat),
              dayjs(endDate, dateFormat),
            ]}
            format={dateFormat}
            onChange={onChangeDate}
          />
        )}
        scroll={{ x: 1500, y: 450 }}
        loading={loadingTable}
      />
    </>
  );
};

export default Absensi;
