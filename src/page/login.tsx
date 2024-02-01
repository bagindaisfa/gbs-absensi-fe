import React, { useState } from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message } from "antd";
import logo from "../favicon.png";

interface LoginProps {
  onLogin: (user: any) => void; // Define the type of onLogin prop
}

const Login: React.FC<LoginProps> = (props: any) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingLogin, setLoadingLogin] = useState(false);

  const onFinish = async (values: any) => {
    setLoadingLogin(true);
    try {
      const response = await fetch(
        `https://internal.gbssecurindo.co.id/login?username=${values.username}&password=${values.password}`
      ); // Replace with your API endpoint
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const result = await response.json();
      if (result.valid) {
        success();
      } else {
        error();
      }
    } catch (err) {
      setLoadingLogin(false);
    }
  };

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Berhasil Login!",
      onClose: () => {
        props.onLogin(true);
        setLoadingLogin(false);
      },
    });
  };

  const error = () => {
    messageApi.open({
      type: "error",
      content: "Login gagal, perhatikan Username dan Password!",
    });
  };

  return (
    <>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Card
          style={{ width: 700, padding: 20 }}
          hoverable
          cover={
            <img
              alt="example"
              src={logo}
              style={{ width: 90, margin: "auto" }}
            />
          }
        >
          <Form
            name="normal_login"
            className="login-form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please input your Username!" },
              ]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your Password!" },
              ]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-form-button"
                loading={loadingLogin}
              >
                Log in
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default Login;
