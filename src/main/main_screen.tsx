// src/App.tsx
import React from "react";
import styled from "styled-components";
import GoogleLoginButton from "./main_components/login_button";
import GoogleLogoutButton from "./main_components/logout_button";

const BackgroundDiv = styled.div`
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
`;

const HeaderDiv = styled.div`
  width: 100%;
  height: 10%;

  display: flex;
  align-items: center;
`;

const SectionDiv = styled.div`
  background-color: gray;
  width: 100%;
  height: 90%;

  display: flex;
  align-items: center;
  flex-direction: column;
`;

const LeftHeaderDiv = styled.div`
  width: 50%;
  height: 100%;

  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  margin-left: 20px;

  color: white;
  font-size: 30pt;
`;

const RightHeaderDiv = styled.div`
  width: 50%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const InfoText = styled.div`
  color: white;
  font-size: 18pt;

  margin-right: 15px;
`;

const MainScreen = () => {
  return (
    <BackgroundDiv>
      <HeaderDiv>
        <LeftHeaderDiv>
          <Title>끄투 RPG</Title>
        </LeftHeaderDiv>
        <RightHeaderDiv>
          <InfoText>문의</InfoText>
        </RightHeaderDiv>
      </HeaderDiv>
      <SectionDiv>
        <GoogleLoginButton />
        <GoogleLogoutButton />
      </SectionDiv>
    </BackgroundDiv>
  );
};

export default MainScreen;
