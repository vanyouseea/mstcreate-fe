import { useState,useRef } from "react";
import { countries } from "./data.js";
import axios from 'axios'

function Msg({ msg }) {
  if (msg === "") {
    return (
      <>
        1. 输入正确的账户和密码后点击开始 <br />
        2. 输入正确验证码之后点击验证 <br />
        3. 耐心等待一段时间即可获得空全局 <br />
        <br />
        PS:如果需要在新全局中删除创建它的帐号，可以勾上删除老账户，系统会自动进行异步删除
      </>
    );
  } else {
    return <div>{msg}</div>;
  }
}

export default function Game() {
  let baseUrl = "http://127.0.0.1:8010";
  const token = useRef("");
  const challengeId = useRef("");
  const azureRegion = useRef("");
  const newTenantId = useRef("");
  const dirName = useRef("");

  const [inputSolution, SetInputSolution] = useState("");
  const [prestage, SetPrestage] = useState(false);
  const [isShowTip, SetIsShowTip] = useState(true);
  const [disableVerifyBtn, SetdisableVerifyBtn] = useState(false);
  const [isDeleteUser, SetIsDeleteUser] = useState(false);
  const [location, SetLocation] = useState("SG");
  const [challengeString, SetChallengeString] = useState("");
  const [username, SetUsername] = useState("");
  const [password, SetPassword] = useState("");
  const [msg, SetMsg] = useState("");

  function handleUsername(e) {
    SetUsername(e.target.value);
  }
  function handlePassword(e) {
    SetPassword(e.target.value);
  }
  function handleLocation(e) {
    SetLocation(e.target.value);
  }
  function handleIsDeleteUser(e) {
    SetIsDeleteUser(e.target.checked);
  }
  function handleInputSolution(e){
    SetInputSolution(e.target.value)
  }

  function startUp() {
    if (username !== "" && password !== "") {
      SetPrestage(true);

      axios({
        url: baseUrl + '/startUp?time='+Date.now(),
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        data: { username: username, password: password }
      }).then(res =>{
        if (res.data==null||res.data===""){
          SetMsg("无法获得token，请检查您的凭据");
          SetPrestage(false);
        }
        else{
          token.current = res.data
          SetMsg("已获得token，正在请求验证码");
          axios({
            url: baseUrl + '/getChallengeCd?time='+Date.now(),
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            data: { token: token.current }
          }).then(res=>{
            challengeId.current = res.data.challengeId;
            SetChallengeString(res.data.challengeString);
            azureRegion.current = res.data.azureRegion
            SetIsShowTip(false);
          }).catch(err=>{
            SetMsg("无法获得验证码");
            SetPrestage(false);
          });
        }
      }).catch(err=>{
        SetMsg("后台系统出现错误，请重试");
        SetPrestage(false);
      })

    } else {
      SetMsg("请输入账户和密码");
    }
  }

  function getChallengeCd(){
    axios({
      url: baseUrl + '/getChallengeCd?time='+Date.now(),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: { token: token.current }
    }).then(res=>{
      challengeId.current = res.data.challengeId;
      SetChallengeString(res.data.challengeString);
      SetIsShowTip(false);
    }).catch(err=>{
      SetMsg("无法获得验证码");
      SetPrestage(false);
    });
  }

  function reset() {
    token.current = "";
    challengeId.current = "";
    azureRegion.current = "";
    newTenantId.current = "";
    dirName.current = "";

    SetInputSolution("");
    SetPrestage(false);
    SetIsShowTip(true);
    SetdisableVerifyBtn(false);
    SetIsDeleteUser(false);
    SetLocation("SG");
    SetChallengeString("");
    SetUsername("");
    SetPassword("");
    SetMsg("");
  }

  function     createTenant(){
    SetdisableVerifyBtn(true)
    SetMsg('正在创建空全局,这会花费较长的时间,请耐心等待...')
    SetIsShowTip(true);

    axios({
      url: baseUrl + '/createTenant?time='+Date.now(),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: {token: token.current, challengeId: challengeId.current, inputSolution: inputSolution, location: location, azureRegion: azureRegion.current }
    }).then(res=>{
      newTenantId.current = res.data.newTenantId;
      dirName.current = res.data.dirName;

      if(newTenantId.current&&dirName.current){
        SetMsg('已成功创建空全局 '+dirName.current+'('+newTenantId.current+') ,正在新建用户中...')
        axios({
          url:baseUrl + '/createUser?time='+Date.now(),
          method:'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          data : {username: username, password: password, tenantId: newTenantId.current, dirName: dirName.current, location: location, deleteUser: isDeleteUser },
        }).then(res=>{
          if(isDeleteUser){
            SetMsg('已成功创建新用户 admin@'+dirName.current+'.onmicrosoft.com ,密码是 '+password+', 将在新全局中异步删除 '+username+' ,您可以继续创建新的空全局')
          }
          else{
            SetMsg('已成功创建新用户 admin@'+dirName.current+'.onmicrosoft.com ,密码是 '+password)
          }
          SetPrestage(false);
          SetdisableVerifyBtn(false)
        }).catch(err=>{
          SetMsg("创建用户时出现错误:"+err);
          SetPrestage(false);
          SetdisableVerifyBtn(false)
        })
      }
      else{
        SetMsg("创建失败，可能是验证码错误");
        SetPrestage(false);
        SetdisableVerifyBtn(false)
      }
    }).catch(err=>{
      SetMsg("后台系统出现错误，请重试");
      SetPrestage(false);
      SetdisableVerifyBtn(false)
    })
  }

  return (
    <div>
      <div>
        <h2>空全局创建系统</h2>
      </div>
      <div className="preinfo">
        <div style={{ marginBottom: "7px", width: "100%" }}>
          <label htmlFor="username">
            <b>账户: </b>
          </label>
          <input
            type="text"
            id="username"
            style={{ width: "77%" }}
            placeholder="请输入微软账户"
            value={username}
            disabled={prestage}
            onChange={handleUsername}
          />
        </div>
        <div style={{ marginBottom: "7px" }}>
          <label htmlFor="password">
            <b>密码: </b>
          </label>
          <input
            type="text"
            id="password"
            style={{ width: "77%" }}
            placeholder="请输入密码"
            value={password}
            disabled={prestage}
            onChange={handlePassword}
          />
        </div>

        <div style={{ marginBottom: "7px" }}>
          <b>国家: </b>
          <select
            id="location"
            value={location}
            style={{ height: "21px", width: "80%" }}
            onChange={handleLocation}
          >
            {countries.map((country) => (
              <option key={country.countryCode} value={country.countryCode}>
                {country.displayName}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "7px" }}>
          <b>删除老账户:</b>{" "}
          <input
            type="checkbox"
            disabled={prestage}
            checked={isDeleteUser}
            onChange={handleIsDeleteUser}
          />
        </div>
      </div>
      <div className="startUp">
        <input
          type="button"
          value="开始"
          style={{ textAlign: "right" }}
          onClick={startUp}
          disabled={prestage}
        />
        &nbsp;
        <input
          type="button"
          value="重置"
          style={{ textAlign: "right" }}
          onClick={reset}
          disabled={prestage}
        />
      </div>
      <div className="msg1" hidden={!isShowTip}>
        <Msg msg={msg} />
      </div>

      <div className="msg2" hidden={isShowTip}>
        <img src={"data:image/png;base64," + challengeString} onClick={getChallengeCd} alt="Verification code" />
        <br />
        验证码:{" "}
        <input style={{ marginBottom: "7px" }} value={inputSolution} onChange={handleInputSolution}/>
        <br />
        <input
          type="button"
          value="验证"
          onClick={createTenant}
          disabled={disableVerifyBtn}
        />
      </div>
    </div>
  );
}
