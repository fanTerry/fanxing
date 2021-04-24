package com.esportzoo.esport.util;

import com.esportzoo.leaguelib.common.domain.Match;
import com.esportzoo.quiz.domain.quiz.QuizLeague;
import com.esportzoo.quiz.domain.quiz.QuizMatch;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * @description: 应用参数
 *
 * @author: Haitao.Li
 *
 * @create: 2019-06-12 14:26
 **/
@Component
public class Application {

	/**静态资源地址*/
	@Value("${expert.res.domain}")
	private String resDomain;

	@Value("${expert.res.host}")
	private String resHost;

	@Value("${expert.upload.path}")
	private String uploadPath;


	/**前端 svn资源图片目录*/
	@Value("${expert.res.domain}/svn/esport-res/mini/images")
	private String resImageDir;

	public String getResDomain() {
		return resDomain;
	}

	public void setResDomain(String resDomain) {
		this.resDomain = resDomain;
	}

	public String getResHost() {
		return resHost;
	}

	public void setResHost(String resHost) {
		this.resHost = resHost;
	}

	public String getUploadPath() {
		return uploadPath;
	}

	public void setUploadPath(String uploadPath) {
		this.uploadPath = uploadPath;
	}

	public String getMatchHomeTeamLogo(Match match) {
		if (StringUtils.isNotBlank(match.getEsportHomeTeamLogo())) {
			return resDomain + match.getEsportHomeTeamLogo();
		} else if (StringUtils.isNotBlank(match.getHomeTeamLogo())) {
			return match.getHomeTeamLogo();
		} else {
			return resImageDir + "/default/default_team.png";
		}
	}

	public String getMatchAwayTeamLogo(Match match) {
		if (StringUtils.isNotBlank(match.getEsportAwayTeamLogo())) {
			return resDomain + match.getEsportAwayTeamLogo();
		} else if (StringUtils.isNotBlank(match.getAwayTeamLogo())) {
			return match.getAwayTeamLogo();
		} else {
			return resImageDir + "/default/default_team.png";
		}
	}

	public String getQuizAwayTeamLogo(QuizMatch quizMatch) {
		if (StringUtils.isNotBlank(quizMatch.getAwayTeamLogo())) {
			return quizMatch.getAwayTeamLogo();
		}else {
			return resImageDir+ "/default/default_team.png";
		}
	}

	public String getQuizHomeTeamLogo(QuizMatch quizMatch) {
		if (StringUtils.isNotBlank(quizMatch.getHomeTeamLogo())) {
			return quizMatch.getHomeTeamLogo();
		}else {
			return resImageDir+ "/default/default_team.png";
		}
	}



    public String getQuizHomeTeamName(QuizMatch quizMatch) {
        if (StringUtils.isNotBlank(quizMatch.getHomeTeamNameAbbr())) {
            return quizMatch.getHomeTeamNameAbbr();
        }else {
            return quizMatch.getHomeTeamName();
        }
    }

    public String getQuizAwayTeamName(QuizMatch quizMatch) {
        if (StringUtils.isNotBlank(quizMatch.getAwayTeamNameAbbr())) {
            return quizMatch.getAwayTeamNameAbbr();
        }else {
            return quizMatch.getAwayTeamName();
        }
    }
	public String getLeagueNameAbbr(QuizLeague quizLeague) {
		if (StringUtils.isNotBlank(quizLeague.getLeagueNameAbbr())) {
			return quizLeague.getLeagueNameAbbr();
		}else {
			return quizLeague.getLeagueName();
		}
	}




	public String getResImageDir() {
		return resImageDir;
	}

	public void setResImageDir(String resImageDir) {
		this.resImageDir = resImageDir;
	}
}
