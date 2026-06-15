# Chapter 1. Reliable, Scalable, and Maintainable Applications

## 1. 챕터 개요

오늘날 많은 애플리케이션은 **compute-intensive**(연산 집약적)가 아니라 **data-intensive**(데이터 집약적)다.
즉, CPU 성능이 병목인 경우는 드물고, **데이터의 양·복잡도·변화 속도**가 진짜 문제다.

data-intensive 애플리케이션은 보통 다음과 같은 표준 building block들을 조합해서 만든다.

- **Databases** — 데이터를 저장하고 나중에 다시 찾을 수 있게 함
- **Caches** — 비싼 연산 결과를 기억해 읽기를 빠르게 함
- **Search indexes** — 키워드 검색이나 다양한 방식의 필터링을 가능하게 함
- **Stream processing** — 비동기적으로 다른 프로세스에 메시지를 보냄
- **Batch processing** — 주기적으로 대량의 누적 데이터를 처리함

이 챕터의 핵심 질문은 "좋은 데이터 시스템이란 무엇인가?"이며, 책 전체를 관통하는
세 가지 관심사인 **Reliability(신뢰성)**, **Scalability(확장성)**, **Maintainability(유지보수성)**를 정의한다.

---

## 2. 핵심 개념 정리

### 2.1 데이터 시스템에 대한 사고방식 (Thinking About Data Systems)

전통적으로 database, queue, cache는 서로 다른 도구로 분류되었다. 하지만 요즘 도구들은
경계가 흐려졌다. 예를 들어 Redis는 데이터스토어이자 message queue로 쓰이고, Kafka는
메시지 큐이면서 데이터베이스 같은 durability 보장을 제공한다.

또한 하나의 도구가 모든 요구를 만족시키지 못하기 때문에, 실제 애플리케이션은 여러 도구를
조합한 **composite data system**으로 설계된다. 이렇게 여러 컴포넌트를 묶으면 그 자체로
하나의 새로운 "데이터 시스템"이 되고, 이때 API 뒤에 숨은 보장(guarantee)을 어떻게
설계하느냐가 중요해진다.

이 책은 이 모든 설계를 관통하는 세 가지 관심사에 집중한다.

### 2.2 Reliability (신뢰성)

직관적 정의: **"무언가 잘못되더라도 시스템이 계속 올바르게 동작하는 것."**

좀 더 구체적으로, reliable한 시스템은:
- 사용자가 기대한 기능을 수행하고
- 사용자의 실수나 예상치 못한 사용법을 견디고
- 예상되는 부하와 데이터 양에서 충분한 성능을 내며
- 무단 접근(unauthorized access)과 오용을 막는다.

#### Fault vs Failure (중요한 구분)

- **Fault(결함)**: 시스템의 한 컴포넌트가 사양에서 벗어난 상태. (부분적)
- **Failure(장애)**: 시스템 **전체**가 사용자에게 요구된 서비스를 제공하지 못하는 상태.

목표는 fault가 0인 것이 아니라(불가능하다), fault가 failure로 번지지 않게 하는 것.
이런 시스템을 **fault-tolerant** 또는 **resilient**하다고 한다.

> 직관에 반하는 사실: 결함을 일부러 유발해서(예: Netflix의 **Chaos Monkey**가 무작위로
> 프로세스를 죽임) 시스템의 fault-tolerance를 항상 검증하는 것이 오히려 신뢰성을 높인다.

#### 세 가지 fault 유형

1. **Hardware faults (하드웨어 결함)**
   - 디스크 고장, RAM 결함, 정전, 케이블 뽑힘 등. 디스크의 MTTF(mean time to failure)는
     약 10~50년이라, 디스크 1만 개를 돌리면 하루 평균 1개가 죽는다.
   - 전통적 대응: **redundancy**(RAID, 이중 전원, 핫스왑 CPU 등) — 단일 머신 신뢰성 강화.
   - 최근 추세: 데이터 양과 연산 수요가 커지면서 여러 머신을 쓰게 되었고, **software
     fault-tolerance**를 추가해 한 머신 전체를 잃어도 견디게 한다. 이러면 rolling upgrade
     같은 운영상 이점(한 노드씩 재부팅)도 생긴다.

2. **Software errors (소프트웨어 오류)**
   - hardware fault는 보통 random·independent하지만, software fault는 **systematic**이라
     여러 노드에서 **동시에**(correlated) 터지는 경향이 있어 더 위험하다.
   - 예: 특정 입력에서만 죽는 커널 버그, 메모리/CPU/디스크를 다 먹는 runaway process,
     느려진 의존 서비스, **cascading failure**(작은 결함이 연쇄적으로 큰 장애로 번짐).
   - 대응에 만능 약은 없다: 가정·상호작용을 면밀히 점검, 철저한 테스트, process isolation,
     크래시 후 재시작 허용, 운영 중 측정·모니터링.

3. **Human errors (인적 오류)**
   - 운영자의 설정 실수가 대규모 outage의 가장 큰 원인이라는 연구가 있다.
   - 대응:
     - 실수 가능성을 줄이는 잘 설계된 abstraction/API/인터페이스
     - 실수가 잦은 곳을 사람이 직접 만지지 않게 분리 + 충분한 **sandbox**(실데이터에 영향 없이 실험)
     - 단위/통합/수동 테스트를 모든 레벨에서 철저히
     - 잘못된 변경을 **빠르게 rollback**할 수 있게(코드 점진 배포 등)
     - 상세한 모니터링(**telemetry**): 성능 지표와 에러율
     - 좋은 운영 관행과 교육

### 2.3 Scalability (확장성)

Scalability는 **"부하(load)가 늘어났을 때 시스템이 대처할 수 있는 능력"**이다.
"확장 가능하다/불가능하다"는 이분법적 라벨이 아니라, *"부하가 X배로 늘면 우리는 어떻게
대응할 것인가?"* 라는 질문이다.

#### Describing Load (부하 기술하기)

부하는 몇 개의 숫자, 즉 **load parameters(부하 파라미터)**로 표현한다. 무엇을 고르느냐는
시스템 아키텍처에 달려 있다. 예:
- 웹 서버의 초당 요청 수(requests per second)
- 데이터베이스의 read/write 비율
- 동시 활성 사용자 수
- 캐시 hit rate

**Twitter 예시 (책의 핵심 사례)** — 두 가지 주요 동작:
- *Post tweet*: 평균 4.6k req/s, 피크 12k req/s
- *Home timeline*: 300k req/s로 팔로우한 사람들의 트윗을 본다

여기서 진짜 도전은 트윗량 자체가 아니라 **fan-out**(한 사용자가 자기 팔로워 모두에게
무언가를 전달해야 하는 것)이다. 두 가지 구현:

- **Approach 1 (읽을 때 계산)**: 트윗은 그냥 저장. 누군가 timeline을 보면 그가 팔로우한
  사람들의 트윗을 그때그때 SQL join으로 모아 시간순 정렬. → 쓰기는 싸지만 읽기가 비쌈.
- **Approach 2 (쓸 때 fan-out)**: 사용자마다 timeline 캐시("우편함")를 둔다. 트윗이
  올라오면 작성자의 모든 팔로워의 캐시에 미리 넣어둔다. → 읽기는 캐시만 보면 되어 매우 쌈.
  대신 쓰기가 비쌈. 트윗 1개당 평균 75명에게, 유명인은 수천만 명에게 써야 함.

Twitter는 Approach 2로 시작했고(읽기 300k vs 쓰기 4.6k라 쓰기에 부담을 옮기는 게 유리),
이때 핵심 load parameter는 **사용자당 팔로워 수의 분포**다. 팔로워가 극단적으로 많은
유명인 때문에 결국 **hybrid**(대부분은 fan-out on write, 초대형 계정만 read 시 merge)로 전환.

#### Describing Performance (성능 기술하기)

부하가 늘 때 두 가지 관점:
- 부하 파라미터를 늘리되 자원을 그대로 두면 성능이 어떻게 되는가?
- 성능을 유지하려면 자원을 얼마나 늘려야 하는가?

성능 지표:
- **Throughput(처리량)**: 초당 처리 레코드 수 — batch processing(예: Hadoop)에서 중요
- **Response time(응답 시간)**: 클라이언트가 요청 후 응답 받기까지 걸린 시간 — online 시스템에서 중요

> **Latency vs Response time**: response time은 클라이언트가 보는 전체 시간(서비스 처리 +
> 네트워크 지연 + 큐 대기). **Latency**는 요청이 처리되기를 "기다리는" 시간. 둘은 다르다.

**Percentiles(백분위수)가 평균보다 중요한 이유**:
- response time은 매 요청마다 달라지므로 하나의 숫자가 아니라 **분포(distribution)**로 봐야 함.
- 평균(mean)은 "전형적인" 사용자 경험을 잘 못 보여준다. 대신 **median(p50)**을 쓴다:
  요청을 정렬해 가운데 값 → "절반의 사용자는 이보다 빠르게 응답받는다".
- **tail latencies(꼬리 지연)**: p95, p99, p999 같은 상위 백분위수. 가장 느린 요청들.
  - 보통 가장 느린 요청을 겪는 사용자가 데이터가 가장 많은(= 가장 가치 있는) 고객인 경우가 많다.
  - Amazon은 내부적으로 p999까지 본다(1000명 중 1명).
- **SLO/SLA**: 서비스 수준 목표/협약을 percentile로 정의(예: "p50 < 200ms, p99 < 1s").
- **Head-of-line blocking**: 서버가 소수의 느린 요청을 처리하느라 뒤의 빠른 요청까지 지연됨.
  그래서 부하 테스트는 클라이언트가 응답을 기다리는 동안에도 계속 요청을 보내야 정확함.
- **Tail latency amplification**: 한 사용자 요청이 백엔드 여러 호출을 병렬로 부르면, 그중
  **하나라도** 느리면 전체가 느려진다 → 백엔드 호출이 많을수록 느린 요청 비율이 증폭됨.

#### Approaches for Coping with Load (부하 대처 방법)

- **Scaling up(vertical / 수직 확장)**: 더 강력한 한 대의 머신으로.
- **Scaling out(horizontal / 수평 확장)**: 여러 작은 머신에 분산 = **shared-nothing** 아키텍처.
- 현실은 둘을 섞은 **pragmatic mix**. 적당히 강력한 머신 몇 대가 작은 머신 수천 대보다 쌀 수 있음.
- **Elastic** 시스템: 부하 증가를 감지해 자동으로 자원을 추가. 수동 확장은 단순하고 예측 가능.
- 핵심 통찰: **"마법의 scaling sauce는 없다."** 대규모 아키텍처는 그 애플리케이션에
  **특화(highly specific)**되어 있다. 어떤 동작이 흔하고 드문지(=load parameters)에 따라
  설계가 완전히 달라진다.

### 2.4 Maintainability (유지보수성)

소프트웨어 비용의 대부분은 초기 개발이 아니라 **지속적인 유지보수**(버그 수정, 시스템 운영,
장애 조사, 새 플랫폼 적응, 새 기능 추가, 기술 부채 상환 등)에서 발생한다.
유지보수를 잘 하기 위한 세 가지 설계 원칙:

1. **Operability (운영성)**: 운영팀이 시스템을 원활히 돌릴 수 있게 하라.
   - 좋은 운영은 나쁜 소프트웨어의 한계를 메우기도 하지만, 좋은 소프트웨어도 나쁜 운영으론
     안정적으로 못 돌린다.
   - 돕는 방법: 좋은 모니터링/가시성(visibility), 자동화·표준 도구 연동 지원, 개별 머신
     의존성 회피, 좋은 문서, 이해하기 쉬운 운영 모델("이렇게 하면 이렇게 된다"),
     합리적 기본값, self-healing + 필요 시 수동 제어.

2. **Simplicity (단순성)**: 새로운 엔지니어가 시스템을 쉽게 이해하도록 복잡도를 관리하라.
   - **accidental complexity(우발적 복잡도)**: 문제 자체가 아니라 구현에서 비롯된 복잡도.
     (Moseley & Marks의 정의)
   - 증상: 거대한 상태 공간, 강한 결합, 일관성 없는 명명/용어, 성능을 위한 해킹, 임시방편 등.
   - 최고의 도구는 **abstraction(추상화)**: 깔끔한 인터페이스 뒤로 구현 디테일을 숨김
     (예: 고급 프로그래밍 언어, SQL).

3. **Evolvability (진화성, = extensibility/modifiability/plasticity)**: 변경을 쉽게 만들라.
   - 요구사항은 끊임없이 변한다. Agile, TDD, refactoring 같은 기법이 도움.
   - 시스템 규모에서의 민첩성은 곧 그 시스템을 얼마나 쉽게 바꿀 수 있느냐(= simplicity와
     abstraction에 크게 의존)에 달려 있다.

---

## 3. 쉬운 예시 / 비유

- **Fault vs Failure**: 비행기의 엔진 4개 중 1개가 꺼지는 것은 **fault**다. 하지만 비행기가
  추락하지 않고 나머지 엔진으로 안전하게 착륙하면 **failure는 막은 것**. 비행기는
  fault-tolerant하게 설계되었기 때문이다.

- **Percentile (꼬리 지연)**: 놀이공원 줄서기를 생각하자. "평균 대기 20분"이라고 해도,
  100명 중 1명은 줄이 꼬여 2시간을 기다릴 수 있다. 이 운 나쁜 1명(p99)이 바로 "다시는
  안 와"라고 말하는 손님이다. 평균만 보면 이 손님을 놓친다.

- **Tail latency amplification**: 피자 10판을 10명에게 동시에 주문했는데, 9곳은 20분,
  1곳은 1시간이 걸린다면 파티는 1시간 뒤에 시작된다. 호출(주문)이 많을수록 "가장 느린
  하나"에 걸릴 확률이 커진다.

- **Fan-out (Twitter)**: 결혼 청첩장을 돌린다고 하자. *읽을 때 계산*은 손님이 올 때마다
  "내가 누굴 초대했더라?"를 매번 계산하는 것이고, *쓸 때 fan-out*은 미리 모든 손님의
  우편함에 청첩장을 넣어두는 것. 초대 인원이 평범하면 후자가 편하지만, 팔로워가 3천만 명인
  유명인이면 우편함 3천만 개에 미리 넣는 비용이 폭발한다 → 그래서 hybrid.

- **Accidental complexity**: 이사할 때 짐을 라벨 없이 아무 상자에나 쑤셔 넣으면, 나중에
  컵 하나 찾는 데 모든 상자를 뒤져야 한다. 문제(이사) 자체가 어려운 게 아니라, 정리 방식
  때문에 생긴 복잡도다. abstraction(상자에 라벨 붙이기)이 이를 줄인다.

---

## 4. 핵심 용어 정리 (Glossary)

| 용어 | 정의 |
|------|------|
| **Data-intensive** | CPU 연산보다 데이터의 양·복잡도·변화 속도가 주된 도전인 애플리케이션 |
| **Reliability** | 결함(fault)이 발생해도 시스템이 계속 올바르게 동작하는 성질 |
| **Fault** | 한 컴포넌트가 사양에서 벗어난 상태 (부분적 문제) |
| **Failure** | 시스템 전체가 요구된 서비스를 제공하지 못하는 상태 |
| **Fault-tolerant / Resilient** | fault가 failure로 번지지 않게 견디는 성질 |
| **Chaos Monkey** | 의도적으로 결함을 유발해 fault-tolerance를 검증하는 도구/기법 |
| **Cascading failure** | 작은 결함이 연쇄적으로 큰 장애로 번지는 현상 |
| **Scalability** | 부하(load) 증가에 대처하는 시스템의 능력 |
| **Load parameter** | 부하를 기술하는 숫자(예: req/s, read/write 비율, 팔로워 분포) |
| **Fan-out** | 한 요청/이벤트가 여러 대상에게 전달되어야 하는 정도 |
| **Throughput** | 단위 시간당 처리량 (batch 시스템의 핵심 지표) |
| **Response time** | 클라이언트가 요청 후 응답까지 보는 전체 시간 |
| **Latency** | 요청이 처리되기를 기다리는(대기) 시간 |
| **Percentile (p50/p95/p99/p999)** | 응답 시간 분포에서의 백분위수; median = p50 |
| **Tail latency** | 상위 백분위수(p99 등)의 느린 응답 시간 |
| **Head-of-line blocking** | 앞의 느린 요청이 뒤의 빠른 요청까지 지연시키는 현상 |
| **Tail latency amplification** | 여러 백엔드 호출 중 하나만 느려도 전체가 느려지는 증폭 효과 |
| **SLA / SLO** | 서비스 수준 협약/목표 (보통 percentile로 정의) |
| **Shared-nothing** | 여러 머신에 분산하는 수평 확장 아키텍처 |
| **Elastic** | 부하에 따라 자동으로 자원을 늘리고 줄이는 시스템 |
| **Maintainability** | 운영·이해·변경을 쉽게 만드는 성질 |
| **Operability** | 운영팀이 시스템을 원활히 돌릴 수 있게 하는 성질 |
| **Accidental complexity** | 문제 본질이 아니라 구현에서 비롯된 불필요한 복잡도 |
| **Abstraction** | 깔끔한 인터페이스 뒤로 구현 디테일을 숨겨 복잡도를 줄이는 도구 |
| **Evolvability** | 변경·확장을 쉽게 만드는 성질 |

---

## 5. 한 줄 요약

> 좋은 데이터 시스템은 **Reliability**(결함을 견디고), **Scalability**(부하 증가에 대처하며),
> **Maintainability**(사람이 운영·이해·변경하기 쉬움)라는 세 가지 관심사를 동시에 충족해야 한다.

---

## 6. 퀴즈 (20문제)

> 먼저 스스로 풀어본 뒤 아래 **정답 & 해설**과 맞춰보세요.

**객관식**

1. 다음 중 "data-intensive" 애플리케이션의 가장 정확한 설명은?
   - (A) CPU 연산이 주된 병목인 애플리케이션
   - (B) 데이터의 양·복잡도·변화 속도가 주된 도전인 애플리케이션
   - (C) GPU를 많이 사용하는 머신러닝 애플리케이션
   - (D) 항상 단일 데이터베이스만 사용하는 애플리케이션

2. fault와 failure의 관계로 올바른 것은?
   - (A) fault는 시스템 전체 중단, failure는 부분 결함이다
   - (B) fault와 failure는 같은 의미다
   - (C) fault는 부분적 결함, failure는 시스템 전체가 서비스를 제공하지 못하는 상태다
   - (D) failure가 먼저 일어나야 fault가 발생한다

3. Netflix의 Chaos Monkey가 보여주는 신뢰성 원칙은?
   - (A) fault를 절대 일어나지 않게 막는 것이 최선이다
   - (B) 의도적으로 fault를 유발해 fault-tolerance를 지속 검증한다
   - (C) 모든 장애는 하드웨어 교체로 해결된다
   - (D) 모니터링만 잘하면 테스트는 필요 없다

4. 다음 중 software fault가 hardware fault보다 위험할 수 있는 이유로 가장 적절한 것은?
   - (A) 항상 복구가 불가능하기 때문
   - (B) random·independent해서 예측이 쉽기 때문
   - (C) systematic이라 여러 노드에서 correlated하게(동시에) 터지기 때문
   - (D) 하드웨어보다 항상 비용이 더 들기 때문

5. response time을 단일 평균값 대신 percentile로 보는 주된 이유는?
   - (A) 평균이 계산하기 더 어려워서
   - (B) 평균은 tail latency를 겪는 사용자 경험을 가린다
   - (C) percentile은 항상 평균보다 작아서
   - (D) percentile은 throughput을 직접 측정해서

6. p99 = 1.5초가 의미하는 것은?
   - (A) 모든 요청이 1.5초 안에 끝난다
   - (B) 평균 응답 시간이 1.5초다
   - (C) 99%의 요청이 1.5초보다 빠르게 응답된다
   - (D) 1.5%의 요청만 응답된다

7. Twitter 사례에서 timeline을 "쓸 때 fan-out"(Approach 2)으로 구현할 때의 트레이드오프는?
   - (A) 읽기가 비싸지고 쓰기가 싸진다
   - (B) 읽기는 싸지만 쓰기 비용이 커진다(특히 팔로워 많은 계정)
   - (C) 읽기·쓰기 모두 싸진다
   - (D) 팔로워 수와 무관하게 비용이 일정하다

8. "head-of-line blocking"에 대한 설명으로 옳은 것은?
   - (A) 빠른 요청이 느린 요청을 추월하는 현상
   - (B) 앞의 소수 느린 요청이 뒤의 빠른 요청까지 지연시키는 현상
   - (C) 캐시가 가득 차서 데이터가 밀려나는 현상
   - (D) 디스크가 고장 나는 현상

9. 다음 중 maintainability의 세 가지 설계 원칙이 아닌 것은?
   - (A) Operability
   - (B) Simplicity
   - (C) Evolvability
   - (D) Profitability

10. "accidental complexity"의 정의로 가장 적절한 것은?
    - (A) 풀려는 문제 자체에 내재된 본질적 복잡도
    - (B) 문제 본질이 아니라 구현에서 비롯된 불필요한 복잡도
    - (C) 하드웨어 결함으로 생긴 복잡도
    - (D) 사용자 수 증가로 생긴 복잡도

11. 복잡도를 줄이는 최고의 도구로 책이 제시한 것은?
    - (A) redundancy
    - (B) abstraction
    - (C) vertical scaling
    - (D) percentile 모니터링

12. batch processing 시스템에서 가장 중요하게 보는 성능 지표는?
    - (A) response time
    - (B) throughput
    - (C) p999 latency
    - (D) cache hit rate

13. "tail latency amplification"이 발생하는 상황은?
    - (A) 단일 백엔드 호출만 있을 때
    - (B) 한 사용자 요청이 여러 백엔드 호출을 부르고, 그중 하나만 느려도 전체가 느려질 때
    - (C) 모든 백엔드가 동일한 속도일 때
    - (D) 캐시 hit rate가 100%일 때

**O/X (참/거짓)**

14. (O/X) "Scalability"는 시스템에 붙이는 이분법적 라벨(확장 가능/불가능)이다.

15. (O/X) response time과 latency는 정확히 같은 의미다.

16. (O/X) 클라우드에서는 단일 머신 redundancy보다 software fault-tolerance로 머신 전체 손실을
    견디게 설계하는 경향이 강해졌다.

17. (O/X) 대규모 시스템을 위한 범용적인 "magic scaling sauce"가 존재한다.

18. (O/X) 인적 오류(human error)에 대한 좋은 대응 중 하나는 잘못된 변경을 빠르게 rollback할 수
    있게 만드는 것이다.

**단답형**

19. 부하를 기술하는 숫자, 즉 "요청 수/초"나 "사용자당 팔로워 분포" 같은 것을 통칭하는 용어는?

20. 수평 확장(scaling out)에서, 여러 머신이 자원을 공유하지 않고 독립적으로 동작하는
    아키텍처를 무엇이라 부르는가?

---

## 7. 정답 & 해설

1. **(B)** — data-intensive는 CPU(compute)가 아니라 데이터의 양·복잡도·변화 속도가 핵심 도전이다.
2. **(C)** — fault는 부분적 결함(컴포넌트가 사양 이탈), failure는 시스템 전체가 서비스를 못 함.
   목표는 fault가 failure로 번지지 않게 하는 것.
3. **(B)** — Chaos Monkey는 일부러 fault를 주입해 fault-tolerance 메커니즘이 실제로 작동하는지
   항상 검증한다. fault를 0으로 만드는 건 비현실적이다.
4. **(C)** — hardware fault는 보통 random·independent하지만, software fault는 systematic이라
   같은 조건의 여러 노드에서 correlated하게 동시에 터질 수 있어 더 위험하다.
5. **(B)** — 평균은 소수의 느린 요청(tail)을 평탄화해 실제 사용자 경험을 가린다. median과 상위
   percentile로 분포를 봐야 한다.
6. **(C)** — p99 = 1.5초는 "요청의 99%가 1.5초 안에 응답된다 = 1%는 그보다 느리다"는 뜻.
7. **(B)** — fan-out on write는 미리 모든 팔로워의 timeline 캐시에 써 두므로 읽기는 싸지만,
   팔로워가 매우 많은 계정의 쓰기 비용이 폭발한다. → Twitter는 hybrid로 전환.
8. **(B)** — 서버가 앞쪽 소수의 느린 요청을 처리하느라 뒤의 빠른 요청까지 막히는 현상.
   그래서 부하 테스트 시 응답을 기다리면서도 계속 요청을 보내야 정확하다.
9. **(D)** — maintainability의 세 원칙은 Operability, Simplicity, Evolvability. Profitability는 아님.
10. **(B)** — accidental complexity는 문제 본질이 아니라 구현에서 비롯된 복잡도(Moseley & Marks).
11. **(B)** — abstraction이 구현 디테일을 깔끔한 인터페이스 뒤로 숨겨 복잡도를 관리하는 최고의 도구.
12. **(B)** — batch는 throughput(처리량)이, online 서비스는 response time이 핵심 지표.
13. **(B)** — 병렬 백엔드 호출이 많을수록 "가장 느린 하나"에 걸릴 확률이 커져 느린 요청 비율이 증폭됨.
14. **X** — Scalability는 라벨이 아니라 "부하가 X배 늘면 어떻게 대처할 것인가"라는 질문이다.
15. **X** — response time은 클라이언트가 보는 전체 시간(처리 + 네트워크 + 큐 대기), latency는
    요청이 처리되기를 기다리는 시간. 둘은 다르다.
16. **O** — 데이터/연산 수요가 커지면서 다수 머신 + software fault-tolerance로 머신 단위 손실을
    견디는 방향으로 이동했고, rolling upgrade 같은 운영 이점도 생긴다.
17. **X** — 범용 magic scaling sauce는 없다. 대규모 아키텍처는 그 애플리케이션의 load parameters에
    맞춰 고도로 특화된다.
18. **O** — 빠른 rollback(점진 배포 등)은 human error의 영향을 줄이는 핵심 대응책 중 하나다.
19. **Load parameter(부하 파라미터)** — 부하를 기술하는 숫자들의 통칭.
20. **Shared-nothing 아키텍처** — 각 머신(노드)이 자원을 공유하지 않고 독립적으로 동작하는 수평 확장 방식.
