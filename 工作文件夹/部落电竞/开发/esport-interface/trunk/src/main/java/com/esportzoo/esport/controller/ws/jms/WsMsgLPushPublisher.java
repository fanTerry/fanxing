package com.esportzoo.esport.controller.ws.jms;

///已迁移到msgcenter
public class WsMsgLPushPublisher extends MessageProducer {
/*
	 private Destination queue;

	public void sendMessage(CommonMsg comMsg) {

		if (comMsg == null) {
			logger.info("WsMsgLPushPublisher-发送通知消息-对象为空取消发送");
			return;
		}

		NettyExecType nettyExecType = NettyExecType.valueOf(comMsg.getExecType());
		if (ObjectUtil.isNull(nettyExecType)){
			logger.info("WsMsgLPushPublisher-【{}】MQ消息推送错误，NettyExecType执行类型为空");
			return;
		}

		String execTypeDesc = nettyExecType.getDescription();
		if (SceneType.MATCHING.getIndex() == comMsg.getSceneType()){
			logger.info("WsMsgLPushPublisher-【{}】MQ消息推送", execTypeDesc);
		}else {
			logger.info("WsMsgLPushPublisher-【{}】MQ消息推送，推送消息内容为：{}", execTypeDesc, comMsg);
		}

		try {
			jmsTemplate.send(queue, new MessageCreator() {
				public Message createMessage(Session session) throws JMSException {
					ObjectMessage message = null;
					try {
						message = session.createObjectMessage();
						message.setObject(comMsg);
					} catch (Exception e) {
						logger.error("WsMsgLPushPublisher-【{}】MQ消息推送异常，推送消息内容为：{}，异常信息为：{}", execTypeDesc, comMsg, e);
					}
					return message;
				}
			});
		} catch (Exception ex) {
			logger.error("WsMsgLPushPublisher-【{}】MQ消息推送异常，推送消息内容为：{}，异常信息为：{}", execTypeDesc, comMsg, ex);
		}
	}
	 
	public void setQueue(Destination queue) {
		this.queue = queue;
	}*/
}