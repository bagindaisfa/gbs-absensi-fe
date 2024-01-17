import React, { useState } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import logo from "./favicon.png";
import Karyawan from "./page/karyawan";
import Lokasi from "./page/lokasi";
import Absensi from "./page/absensi";
import Download from "./page/download";
import Users from "./page/users";
import Shift from "./page/shift";
import DownloadJadwal from "./page/downloadJadwal";
import AbsenManual from "./page/absenManual";
const { Header, Content, Footer, Sider } = Layout;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const getItem = (
  label: string,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem => ({ key, label, icon, children });

const items: MenuItem[] = [
  getItem("Absensi", "1", <PieChartOutlined />),
  getItem("Master", "sub1", <DesktopOutlined />, [
    getItem("Karyawan", "2"),
    getItem("Lokasi", "3"),
    getItem("Shift", "4"),
    getItem("Users", "5"),
  ]),
  getItem("Download", "sub2", <FileOutlined />, [
    getItem("Absen", "6"),
    getItem("Jadwal", "7"),
  ]),
  getItem("Absen Manual", "8", <EditOutlined />),
];

const App: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<string[]>(["1"]);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const currentYear = new Date().getFullYear();
  const handleMenuClick = ({ keyPath }: { keyPath: React.Key[] }) => {
    setSelectedMenu(keyPath as string[]);
    console.log(keyPath as string[]);
  };
  let contentComponent: React.ReactNode = null;

  if (selectedMenu.includes("1")) {
    contentComponent = <Absensi />;
  } else if (selectedMenu.includes("sub1") && selectedMenu.includes("2")) {
    contentComponent = <Karyawan />;
  } else if (selectedMenu.includes("sub1") && selectedMenu.includes("3")) {
    contentComponent = <Lokasi />;
  } else if (selectedMenu.includes("sub1") && selectedMenu.includes("4")) {
    contentComponent = <Shift />;
  } else if (selectedMenu.includes("sub1") && selectedMenu.includes("5")) {
    contentComponent = <Users />;
  } else if (selectedMenu.includes("sub2") && selectedMenu.includes("6")) {
    contentComponent = <Download />;
  } else if (selectedMenu.includes("sub2") && selectedMenu.includes("7")) {
    contentComponent = <DownloadJadwal />;
  } else if (selectedMenu.includes("8")) {
    contentComponent = <AbsenManual />;
  }
  const generateBreadcrumb = (selectedMenu: string[]) => {
    const breadcrumbItems: React.ReactNode[] = [];
    items.forEach((item: any) => {
      if (selectedMenu.includes(item.key)) {
        breadcrumbItems.push(
          <Breadcrumb.Item key={item.key}>{item.label}</Breadcrumb.Item>
        );
        if (item.children) {
          item.children.forEach((subItem: any) => {
            if (selectedMenu.includes(subItem.key)) {
              breadcrumbItems.push(
                <Breadcrumb.Item key={subItem.key}>
                  {subItem.label}
                </Breadcrumb.Item>
              );
            }
          });
        }
      }
    });
    return breadcrumbItems;
  };
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="demo-logo-vertical">
          <img
            src={logo}
            alt="Logo"
            style={{
              width: 60,
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 65,
            }}
          />
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={items}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <span
            style={{ marginLeft: 20, fontWeight: "bold", fontSize: "x-large" }}
          >
            GBS Operasional
          </span>
        </Header>
        <Content style={{ margin: "24px 16px 0" }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            {generateBreadcrumb(selectedMenu)}
          </Breadcrumb>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {contentComponent}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          GBS Attendance ©{currentYear} Created by Baginda Isfa
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;
