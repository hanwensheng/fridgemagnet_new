import { View, Text } from '@tarojs/components';
import BasePage from '@/components/base-page';
import './index.scss';

const PromoterAgreement = () => {
  return (
    <BasePage navTitle='' navShowBack>
      <View className='agreement-page'>
        <View className='agreement-container'>
          <View className='agreement-title'>推广居间合作协议</View>

          <View className='agreement-content'>
            <Text className='content-text'>
              <Text className='text-bold'>甲方（平台方）</Text>
              ：本小程序运营主体，信息以小程序公示主体信息为准鉴于甲方拥有【冰箱贴上爱】（以下简称小程序）的运营、销售及全部经营权，乙方拥有私域流量、社交渠道、推广资源，自愿为甲方提供居间推广引流服务。依据《中华人民共和国民法典》中关于居间合同的相关规定，乙方在小程序端自主点击【同意并注册】按钮，即视为甲乙双方本着自愿、平等、诚信、互利原则，自愿达成本居间合作协议，双方均认可本协议法律效力并共同遵守。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第一条 合作内容、性质与协议生效规则</View>
            <Text className='content-text'>
              1、乙方作为独立居间推广合作方，利用自身朋友圈、社群、短视频、私域、社交渠道等方式，为甲方小程序进行推广、引流、介绍客户。
              {'\n'}
              2、乙方介绍的用户在甲方小程序成功下单付款，即视为乙方居间推广成功，甲方按本协议约定结算佣金。
              {'\n'}
              3、本协议为线上居间合作协议，不属于劳动合同、劳务合同、挂靠关系，甲乙双方不存在劳动关系、社保、福利、用工义务，乙方不归属甲方员工体系，乙方为自主独立推广合作方。
              {'\n'}
              4、合作期限：乙方点击同意本协议、完成推广账号注册之日起生效，长期有效，到期无异议自动续期。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第二条 双方权利与义务</View>
            <Text className='content-text'>
              1、甲方权利义务{'\n'}
              （1）甲方负责小程序运营、产品制作、发货、售后、客服、订单核验等全部经营工作。{'\n'}
              （2）甲方提供专属推广二维码给乙方推广使用。{'\n'}
              （3）甲方按照本协议约定，按时、足额结算乙方推广佣金。{'\n'}
              （4）甲方有权监督乙方推广内容，对违规、虚假、夸大、误导宣传有权要求整改或终止合作。
              {'\n\n'}
              2、乙方权利义务{'\n'}
              （1）乙方按照甲方正规素材及价格体系进行推广，不得私自加价、降价、私自承诺售后、私自收款。
              {'\n'}
              （2）乙方不得发布虚假宣传、夸大、违规营销内容，不得利用甲方名义从事违法违规活动。
              {'\n'}
              （3）乙方负责引流、介绍客户，不承担甲方生产、发货、售后、物流等经营责任。{'\n'}
              （4）乙方不得跨渠道恶意刷单、自刷、套现、虚假订单，一经发现取消全部佣金并终止合作。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第三条 佣金结算规则</View>
            <Text className='content-text'>
              1、结算模式：CPS成交佣金模式，仅结算真实付款有效订单。{'\n'}
              2、佣金比例：每单佣金为订单实付金额的固定比例。{'\n'}
              3、有效订单定义：用户正常付款、无退款、无纠纷、非刷单、非虚假测试订单。{'\n'}
              4、剔除规则：用户全额退款、部分退款、恶意下单、刷单订单，甲方不予结算佣金，已结算的有权追回。
              {'\n'}
              5、结算周期：用户下单后，立即完成结算。{'\n'}
              6、结算方式：甲方转账至乙方指定微信零钱里。{'\n'}
              7、税费约定：乙方所得佣金相关税费，由乙方本人自行申报、承担，甲方不代扣代缴、不承担任何税费责任。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第四条 客户归属与保护机制</View>
            <Text className='content-text'>
              1、通过乙方专属推广码、专属链接、专属渠道进入小程序下单的客户，永久归属乙方渠道。
              {'\n'}
              2、老客户复购、二次下单，不再结算乙方佣金。{'\n'}
              3、甲方不得私自截留乙方推广客户、不得更换渠道归属。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第五条 保密与知识产权</View>
            <Text className='content-text'>
              1、乙方不得外泄甲方小程序运营数据、佣金比例、客户信息、产品素材、内部规则。{'\n'}
              2、甲方所有图片、文案、产品设计、小程序代码均为甲方知识产权，乙方仅可用于本次推广，禁止二次商用、倒卖、转发至其他商业用途。
              {'\n'}
              3、协议终止后，保密义务持续有效。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第六条 禁止行为与违约条款</View>
            <Text className='content-text'>
              1、乙方严禁刷单、虚假下单、恶意退款套利、批量薅佣金，一经发现：{'\n'}
              （1）立即终止合作；{'\n'}
              （2）取消所有未结算佣金；{'\n'}
              （3）追回已违规所得佣金。{'\n\n'}
              2、乙方违规宣传给甲方造成投诉、封号、处罚、损失的，由乙方承担全部赔偿责任。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第七条 合作终止</View>
            <Text className='content-text'>
              1、任意一方可提前7天告知对方终止合作。{'\n'}
              2、终止合作后，终止前产生的有效订单佣金甲方正常结算。{'\n'}
              3、乙方终止后不得继续使用甲方品牌、素材进行推广。
            </Text>
          </View>

          <View className='agreement-content'>
            <View className='section-title'>第八条 其他</View>
            <Text className='content-text'>
              1、本协议为线上电子协议，乙方在小程序点击【同意并注册】按钮，即视为协议生效，甲乙双方各持有电子协议版本，具备同等法律效力，无需手写签字盖章。
            </Text>
          </View>
        </View>
      </View>
    </BasePage>
  );
};

export default PromoterAgreement;
