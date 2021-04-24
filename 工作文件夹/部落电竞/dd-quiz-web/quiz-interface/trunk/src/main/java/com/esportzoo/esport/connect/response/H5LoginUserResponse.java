package com.esportzoo.esport.connect.response;

import java.io.Serializable;

/**
 * @author tingting.shen
 * @date 2019/07/17
 */
public class H5LoginUserResponse implements Serializable {

	private static final long serialVersionUID = -3459229765555699647L;

	private Long id;
	private String nickName;
	private String phone;
	private String icon;
	private int vipLevel;
	private int followers;
	private int fans;
	private String token;
	public Long getId() {
		return id;
	}
	public String getNickName() {
		return nickName;
	}
	public String getPhone() {
		return phone;
	}
	public String getIcon() {
		return icon;
	}
	public int getVipLevel() {
		return vipLevel;
	}
	public int getFollowers() {
		return followers;
	}
	public int getFans() {
		return fans;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public void setNickName(String nickName) {
		this.nickName = nickName;
	}
	public void setPhone(String phone) {
		this.phone = phone;
	}
	public void setIcon(String icon) {
		this.icon = icon;
	}
	public void setVipLevel(int vipLevel) {
		this.vipLevel = vipLevel;
	}
	public void setFollowers(int followers) {
		this.followers = followers;
	}
	public void setFans(int fans) {
		this.fans = fans;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}
}
