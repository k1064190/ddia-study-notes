# Chapter 2. Data Models and Query Languages

## 1. 챕터 개요

**Data model**은 소프트웨어가 어떻게 만들어지는지뿐 아니라 우리가 풀려는 문제를 *어떻게
사고하는지*까지 바꾸는, 가장 중요한 설계 요소다. 대부분의 애플리케이션은 여러 data model을
층층이 쌓아 만든다. 각 층의 핵심 질문은 "이 층은 아래 층 위에서 어떻게 표현되는가?"이다.
(예: 앱 객체 → JSON/관계형 테이블 → 디스크 바이트 → 전기 신호)

이 챕터는 데이터를 저장하고 질의하기 위한 다양한 모델을 비교한다. 크게 세 가지:
- **Relational model** (SQL)
- **Document model** (NoSQL의 한 갈래)
- **Graph-based model**

그리고 각 모델에 딸린 **query language**들(SQL, MapReduce, Cypher, SPARQL, Datalog)을 다룬다.
핵심 메시지: **"정답인 단일 모델은 없다. 데이터의 관계 구조에 맞는 모델을 골라야 한다."**

---

## 2. 핵심 개념 정리

### 2.1 Relational Model vs Document Model

#### 관계형 모델의 배경
1970년 Edgar Codd가 제안한 **relational model**은 데이터를 **relation**(SQL의 table)으로,
각 relation을 정렬되지 않은 **tuple**(row)들의 모음으로 표현한다. 비즈니스 데이터 처리
(트랜잭션 처리 transaction processing, 일괄 처리 batch processing)에서 수십 년간 지배적이었고,
구현 디테일을 깔끔한 인터페이스 뒤로 숨기는 데 크게 성공했다.

#### NoSQL의 탄생
2010년대 **NoSQL**(원래는 트위터 해시태그, 후에 "Not Only SQL"로 재해석)이 부상한 동기:
- 매우 큰 데이터셋이나 높은 write throughput에 대한 **더 나은 scalability** 필요
- 상용 RDBMS보다 **무료/오픈소스** 선호
- 관계형 모델이 잘 지원 못 하는 특수 질의 연산
- 관계형 스키마의 제약에 대한 불만, 더 **동적이고 표현력 있는** 데이터 모델 욕구

저자의 전망: 미래는 관계형과 비관계형의 **polyglot persistence**(공존)이다.

#### Object-Relational Mismatch (임피던스 불일치)
객체지향 코드의 객체와 관계형 테이블/행/열 사이에는 어색한 변환 층(**impedance mismatch**)이
필요하다. **ORM**(Object-Relational Mapping) 프레임워크가 이 boilerplate를 줄여주지만
완전히 없애진 못한다.

이력서(LinkedIn 프로필) 같은 데이터는 본질적으로 **하나의 객체 + 그에 딸린 일대다(one-to-many)
구조**(여러 직장, 여러 학력, 여러 연락처)다. 관계형에선 별도 테이블 + foreign key로 쪼개지만,
JSON 같은 **document model**로는 자기완결적 트리(self-contained tree)로 자연스럽게 표현된다.
이때 **locality(지역성)**의 이점도 있다: 프로필 전체를 한 번의 조회로 가져올 수 있다.

#### Many-to-One과 Many-to-Many 관계
도시·지역·산업 같은 값을 **ID로 정규화(normalization)**하면(중복 제거) 다음 이점이 있다:
표기 일관성, 한 곳만 고치면 됨, 지역화(localization) 지원, 검색 용이.
하지만 ID로 참조하면 **many-to-one**(여러 사람이 한 도시) 관계가 생기고, 이는 document model이
약한 부분이다(join 지원이 약함). 데이터는 시간이 지나며 점점 상호 연결되어
**many-to-many** 관계가 늘어나는 경향이 있다(예: 추천서를 쓴 사람도 시스템의 사용자).

#### Document 데이터베이스는 역사를 반복하는가?
- **Hierarchical model** (1970년대 IBM IMS): 데이터를 트리로 표현 → JSON과 유사. 하지만
  many-to-many를 잘 못 다루고 join이 없었다.
- 이를 풀기 위한 두 해법:
  - **Network model** (CODASYL): 레코드가 여러 부모를 가질 수 있는 그래프. 접근 경로
    (access path)를 코드로 직접 따라가야 해서 복잡하고 유연성이 낮았다.
  - **Relational model**: query optimizer가 접근 경로를 자동으로 정해줌 → 선언적이고 유연.
- 즉 document model은 어떤 면에서 hierarchical model의 부활이지만, many-to-one/many-to-many는
  관계형처럼 **document reference**(외래키와 유사)로 표현하고 보통 application 코드에서 해소한다.

#### 오늘날 Relational vs Document — 어느 것을 쓸까?
- **application 코드 단순성**:
  - 데이터가 트리 형태(one-to-many, 한 번에 전체 로드)이면 **document model**이 유리.
  - many-to-many 관계가 많으면 **relational model**(join)이 유리. document로 하면 비정규화
    유지나 application-level join이 필요해 복잡·느려짐.
- **schema flexibility**:
  - document DB는 보통 **schema-on-read**(읽을 때 구조 해석, 암묵적 스키마) — *schemaless*가
    아니라 "스키마 강제가 없을 뿐". 동적 타입 언어의 런타임 타입 체크에 비유됨.
  - relational DB는 **schema-on-write**(쓸 때 스키마 강제, 명시적) — 정적 타입의 컴파일 타임
    체크에 비유됨.
  - schema-on-read는 항목들이 제각각이거나 외부가 구조를 결정할 때 유리. 마이그레이션 시
    document는 코드에서 처리, relational은 `ALTER TABLE`(대부분 빠름) + `UPDATE`(대용량 시 느릴 수 있음).
- **query를 위한 data locality**:
  - document를 통째로(예: 단일 연속 문자열) 저장하면 전체를 자주 필요로 할 때 유리. 일부만
    필요해도 전체를 로드해야 해서 낭비일 수 있고, 보통 **document가 작을 때** 권장.
  - locality는 document에만 있는 개념은 아님(예: Google Spanner, Oracle의 multi-table index
    cluster table, Cassandra/HBase의 column-family).
- **convergence(수렴)**: 현대 관계형 DB는 JSON/XML을 지원하고, document DB(RethinkDB,
  최근 MongoDB)는 join 비슷한 기능을 추가하고 있다. 두 모델은 점점 닮아가며, 결국
  **hybrid**가 미래로 보인다.

### 2.2 Query Languages for Data

#### Declarative vs Imperative
- **Imperative(명령형)**: *어떻게* 할지 단계별로 지시(반복문, 조건문 등). 예: 일반 코드, IMS/CODASYL.
- **Declarative(선언형)**: *무엇을* 원하는지(결과 조건)만 기술하고, *어떻게*는 시스템(query
  optimizer)에 맡김. 예: SQL, relational algebra.
- declarative의 장점:
  - 간결하고 다루기 쉬움
  - 구현 디테일(예: 인덱스 사용)을 숨겨, DB가 성능 개선을 해도 query를 안 바꿔도 됨
  - **병렬 실행(parallel execution)**에 유리 — 실행 순서를 명시하지 않으므로 멀티코어 활용이 쉬움
- **웹에서의 declarative 예**: **CSS**(선택자로 "무엇"을 스타일링할지 선언) vs JavaScript로
  DOM을 직접 조작하는 명령형 방식. CSS가 훨씬 낫다.

#### MapReduce Querying
- **MapReduce**는 선언형과 명령형의 중간. 많은 머신에 걸쳐 대량 데이터를 처리하는 프로그래밍
  모델로, **map**(각 document에서 key-value 방출)과 **reduce**(같은 key의 값들을 집계)
  함수를 사용자가 작성한다. 두 함수는 **순수 함수(pure function)**여야 한다(입력만 사용, 부작용 없음).
- MongoDB의 MapReduce 예가 책에 나오며, 같은 일을 더 선언적으로 하는 **aggregation pipeline**도 등장.

### 2.3 Graph-Like Data Models

many-to-many 관계가 매우 흔하고 복잡하면 데이터를 **graph**(vertex/node + edge/relationship)로
모델링하는 것이 자연스럽다. 예: 소셜 그래프, 웹 그래프, 도로/철도 네트워크.
그래프는 **동질적(homogeneous)** 데이터에 국한되지 않는다 — 사람·장소·이벤트 등 이질적 객체를
한 그래프에 담을 수 있다(예: Facebook).

#### Property Graph Model (예: Neo4j, Titan, InfiniteGraph)
- 각 **vertex**: 고유 ID, 나가는/들어오는 edge 집합, properties(key-value 모음)
- 각 **edge**: 고유 ID, 시작/끝 vertex, **label**(관계의 종류), properties
- 특징: 어떤 vertex든 어떤 vertex와 연결 가능, 특정 vertex에서 들어오고 나가는 edge를 효율적으로
  탐색 가능, 서로 다른 label로 한 그래프에 여러 종류의 정보 저장 → 진화·확장에 유연.
- **Cypher**: Neo4j의 declarative query language. 패턴 매칭으로 그래프를 질의한다.

#### Triple-Stores와 SPARQL
- **Triple-store**: 모든 정보를 **(subject, predicate, object)** 세 요소의 triple로 저장.
  예: `(Jim, likes, bananas)`. subject는 graph의 vertex에 해당하고, object는 (1) 원시 값
  (property) 또는 (2) 다른 vertex(edge)일 수 있다.
- **RDF**(Resource Description Framework): semantic web을 위한 triple 표현 표준. URI로
  전역 식별. Turtle/XML 등 포맷. (semantic web 자체는 실무에서 크게 성공하진 못함.)
- **SPARQL**: RDF triple-store용 declarative query language (Cypher보다 먼저 나왔고 영향을 줌).

#### Datalog
- 더 오래된(1980년대) 기반 언어. 데이터를 **predicate(subject, object)** 형태의 fact로 표현하고,
  **rule**(다른 predicate로부터 새 predicate를 유도)로 질의를 조합한다. Cypher/SPARQL의 이론적 토대.

#### 그래프 모델 vs 네트워크 모델(CODASYL)
표면상 비슷해 보이지만 다르다:
- CODASYL은 **schema가 어떤 레코드가 어디에 중첩될 수 있는지 강하게 제약** → 그래프는 제약 없음.
- CODASYL은 원하는 데이터에 도달하려면 **특정 access path를 코드로 따라가야** 함 → 그래프는
  어떤 vertex든 ID로 직접 참조하거나 인덱스로 찾을 수 있음.
- CODASYL은 자식이 순서 있는 집합이라 DB가 정렬 유지 → 그래프는 정렬 없음.
- CODASYL의 질의는 명령형이라 스키마 변경에 취약 → 그래프 질의는 선언형(Cypher/SPARQL/Datalog).

---

## 3. 쉬운 예시 / 비유

- **Impedance mismatch**: 둥근 구멍(객체)에 네모난 못(테이블 행)을 맞추는 일. ORM은 그 사이에
  끼우는 어댑터지만, 모양이 본질적으로 달라 마찰이 완전히 사라지진 않는다.

- **One-to-many = document, many-to-many = relational**: 한 사람의 이력서는 그 사람 "밑에"
  자연스럽게 트리로 매달린다(직장·학력) → document가 편하다. 반면 "이 회사에서 일한 모든
  사람" "이 사람을 추천한 모든 사람"처럼 서로 얽히면(many-to-many) 별도 테이블 + join이 깔끔하다.

- **Schema-on-read vs schema-on-write**: 이삿짐 상자에 "그냥 넣고 열 때 확인"(schema-on-read,
  동적 타입) vs "넣기 전에 라벨 규칙을 강제"(schema-on-write, 정적 타입). 항목이 제각각이면
  전자가, 일관성·안정성이 중요하면 후자가 낫다.

- **Declarative(SQL/CSS) vs Imperative(코드/DOM 조작)**: "파란 글씨로 만들어줘"(선언)
  vs "각 글자를 찾아 색을 바꾸는 루프를 직접 짠다"(명령). 선언형은 *무엇*만 말하고 *어떻게*는
  엔진에 맡기므로, 엔진이 더 똑똑해지면 내 코드는 그대로 둬도 빨라진다.

- **Graph 모델**: 지하철 노선도. 역(vertex)과 노선(edge)으로 "A역에서 B역까지 환승 2번 이내
  경로"를 묻는 것이, 같은 질의를 관계형 테이블의 여러 self-join으로 짜는 것보다 훨씬 자연스럽다.

---

## 4. 핵심 용어 정리 (Glossary)

| 용어 | 정의 |
|------|------|
| **Data model** | 데이터를 어떻게 표현·구조화하고 사고할지 정하는 추상 모델 |
| **Relational model** | 데이터를 relation(table)과 tuple(row)로 표현하는 모델 (SQL) |
| **NoSQL** | 비관계형 데이터스토어의 총칭 ("Not Only SQL") |
| **Polyglot persistence** | 한 시스템에서 관계형·비관계형 등 여러 저장소를 함께 쓰는 것 |
| **Impedance mismatch** | 객체지향 코드와 관계형 테이블 사이의 변환 마찰 |
| **ORM** | Object-Relational Mapping; 객체↔테이블 변환 boilerplate를 줄이는 도구 |
| **Document model** | 데이터를 JSON/XML 같은 자기완결적 트리 문서로 저장하는 모델 |
| **One-to-many** | 한 레코드가 여러 하위 레코드를 갖는 관계(트리) |
| **Many-to-one / Many-to-many** | 여러 레코드가 하나/서로 다수를 참조하는 관계 |
| **Normalization** | 중복을 ID 참조로 제거하는 것 |
| **Locality** | 관련 데이터를 가까이 저장해 한 번에 읽게 하는 성질 |
| **Hierarchical model** | 데이터를 트리로 표현한 옛 모델 (IBM IMS) |
| **Network model (CODASYL)** | 레코드가 여러 부모를 갖는 그래프형 옛 모델; access path를 코드로 탐색 |
| **Access path** | 원하는 데이터에 도달하기 위해 따라가는 경로 |
| **Schema-on-read** | 읽을 때 구조를 해석(암묵적 스키마); document DB에 흔함 |
| **Schema-on-write** | 쓸 때 스키마를 강제(명시적); relational DB의 방식 |
| **Declarative query** | *무엇*을 원하는지 기술, *어떻게*는 엔진에 맡김 (SQL, CSS, Cypher) |
| **Imperative query** | *어떻게* 할지 단계별로 지시 (IMS/CODASYL) |
| **Query optimizer** | declarative 질의의 실행 방법(access path 등)을 자동 결정하는 모듈 |
| **MapReduce** | map/reduce 순수 함수로 분산 대용량 데이터를 처리하는 모델 |
| **Property graph** | vertex/edge에 properties를 붙이는 그래프 모델 (Neo4j) |
| **Cypher** | property graph용 declarative query language |
| **Triple-store** | (subject, predicate, object) triple로 저장하는 모델 |
| **RDF** | semantic web을 위한 triple 표준 |
| **SPARQL** | RDF triple-store용 declarative query language |
| **Datalog** | rule 기반의 오래된 declarative 데이터 모델/언어 |

---

## 5. 한 줄 요약

> 데이터의 관계 구조가 모델 선택을 결정한다 — 트리형(one-to-many)이면 **document**,
> 복잡하게 얽힌 many-to-many면 **relational(join)** 또는 **graph**, 그리고 declarative query
> language는 *무엇*만 기술해 엔진이 *어떻게*를 최적화하게 한다.

---

## 6. 퀴즈 (20문제)

> 먼저 스스로 풀어본 뒤 아래 **정답 & 해설**과 맞춰보세요.

**객관식**

1. relational model을 1970년에 제안한 사람은?
   - (A) Martin Kleppmann
   - (B) Edgar Codd
   - (C) Jim Gray
   - (D) Michael Stonebraker

2. "impedance mismatch"가 가리키는 것은?
   - (A) 네트워크 지연과 디스크 지연의 차이
   - (B) 객체지향 코드와 관계형 테이블 구조 사이의 변환 마찰
   - (C) 읽기와 쓰기 처리량의 불균형
   - (D) CPU와 메모리 속도 차이

3. 다음 중 document model이 relational model보다 **유리한** 경우는?
   - (A) 데이터에 many-to-many 관계가 많을 때
   - (B) 데이터가 트리(one-to-many) 형태이고 보통 한 번에 전체를 로드할 때
   - (C) 여러 곳에서 동일 값을 참조해 join이 잦을 때
   - (D) 강한 schema 강제가 핵심 요구일 때

4. schema-on-read에 대한 설명으로 옳은 것은?
   - (A) 데이터에 스키마가 전혀 없다는 뜻이다
   - (B) 쓸 때 스키마를 강제한다
   - (C) 구조가 암묵적이며 읽을 때 해석된다 (정적 타입이 아니라 동적 타입에 비유)
   - (D) relational DB만의 특징이다

5. normalization(정규화)으로 데이터를 ID 참조로 만들 때 생기는 관계는?
   - (A) one-to-one만
   - (B) many-to-one (여러 레코드가 한 항목을 참조)
   - (C) 관계가 사라진다
   - (D) tree 관계만

6. declarative query language(SQL 등)의 장점이 **아닌** 것은?
   - (A) 구현 디테일을 숨겨 엔진이 최적화해도 query를 안 바꿔도 된다
   - (B) 병렬 실행에 유리하다
   - (C) 간결하다
   - (D) 실행 단계 순서를 개발자가 직접 통제할 수 있다

7. 웹에서 declarative 접근의 대표 예로 책이 든 것은?
   - (A) JavaScript DOM 직접 조작
   - (B) CSS 선택자
   - (C) HTTP 요청
   - (D) WebSocket

8. document database가 "역사를 반복한다"고 할 때 비교 대상이 된 옛 모델은?
   - (A) relational model
   - (B) hierarchical model (IBM IMS)
   - (C) key-value store
   - (D) column-family store

9. network model(CODASYL)의 특징으로 옳은 것은?
   - (A) query optimizer가 access path를 자동 결정한다
   - (B) 원하는 데이터까지 access path를 코드로 직접 따라가야 한다
   - (C) 모든 질의가 declarative다
   - (D) 레코드는 부모를 가질 수 없다

10. MapReduce에서 map과 reduce 함수가 만족해야 하는 조건은?
    - (A) 부작용이 있어야 한다
    - (B) 전역 변수를 수정해야 한다
    - (C) 순수 함수(pure function)여야 한다 (입력만 사용, 부작용 없음)
    - (D) 반드시 SQL로 작성한다

11. property graph model에서 edge가 갖는 것이 **아닌** 것은?
    - (A) 고유 ID
    - (B) 시작/끝 vertex
    - (C) label(관계 종류)
    - (D) query optimizer

12. triple-store의 기본 저장 단위는?
    - (A) (key, value)
    - (B) (subject, predicate, object)
    - (C) (row, column, table)
    - (D) (map, reduce, shuffle)

13. RDF triple-store를 질의하기 위한 declarative 언어는?
    - (A) Cypher
    - (B) Datalog
    - (C) SPARQL
    - (D) MapReduce

14. graph model이 데이터 진화·확장에 유리한 이유로 가장 적절한 것은?
    - (A) 모든 데이터가 반드시 동질적이어야 해서
    - (B) 서로 다른 label로 한 그래프에 이질적 정보를 담고 어떤 vertex든 연결할 수 있어서
    - (C) schema를 항상 강하게 강제해서
    - (D) join을 절대 쓰지 않아서

**O/X (참/거짓)**

15. (O/X) 모든 애플리케이션에 항상 최적인 단일 data model이 존재한다.

16. (O/X) document model은 many-to-many 관계와 join을 relational model보다 잘 처리한다.

17. (O/X) "schemaless"라고 불리는 document DB도 사실은 암묵적 스키마(schema-on-read)를 가진다.

18. (O/X) 관계형 DB와 document DB는 서로의 기능을 흡수하며 수렴(convergence)하는 추세다.

**단답형**

19. declarative 질의에서 실행 방법(어떤 인덱스/access path를 쓸지)을 자동으로 결정해 주는
    DB 내부 모듈의 이름은?

20. 한 시스템 안에서 관계형·document·graph 등 여러 종류의 저장소를 용도에 맞게 함께 쓰는
    접근을 무엇이라 부르는가?

---

## 7. 정답 & 해설

1. **(B)** — relational model은 1970년 Edgar Codd가 제안했다.
2. **(B)** — impedance mismatch는 객체(코드)와 테이블(관계형) 구조 차이에서 오는 변환 마찰.
   ORM이 줄여주지만 없애진 못한다.
3. **(B)** — 트리형(one-to-many)이고 전체를 한 번에 읽는 데이터는 document가 locality·단순성 면에서 유리.
   many-to-many·잦은 join은 relational이 낫다.
4. **(C)** — schema-on-read는 구조가 암묵적이고 읽을 때 해석된다. "스키마가 없다"가 아니라
   "쓸 때 강제하지 않을 뿐"이며, 동적 타입 언어에 비유된다.
5. **(B)** — 값을 ID로 참조하면 many-to-one(여러 사람이 한 도시를 참조)이 생기고, 이는 document가 약한 부분.
6. **(D)** — 실행 순서를 개발자가 직접 통제하는 것은 imperative의 특징이다. declarative는 그 통제를
   포기하는 대신 최적화·병렬화·간결함을 얻는다.
7. **(B)** — CSS가 declarative의 웹 사례. "무엇"을 스타일링할지 선택자로 선언한다.
8. **(B)** — document model은 JSON 트리라는 점에서 hierarchical model(IMS)의 부활에 비유된다.
   단, many-to-one/many-to-many는 document reference로 따로 처리.
9. **(B)** — CODASYL은 access path를 코드로 직접 따라가야 하는 명령형이었다. 자동 최적화는 relational의 것.
10. **(C)** — map/reduce는 순수 함수여야 분산 환경에서 안전하게 재실행·병렬화할 수 있다.
11. **(D)** — query optimizer는 declarative 엔진의 구성요소이지 edge의 속성이 아니다. edge는
    ID, 시작/끝 vertex, label, properties를 가진다.
12. **(B)** — triple-store는 (subject, predicate, object) 단위로 저장한다.
13. **(C)** — SPARQL이 RDF용 declarative query language. Cypher는 property graph용, Datalog은 rule 기반 토대.
14. **(B)** — 서로 다른 label로 이질적 정보를 한 그래프에 담고 어떤 vertex든 연결할 수 있어
    진화·확장에 유연하다.
15. **X** — 만능 단일 모델은 없다. 데이터의 관계 구조에 맞는 모델을 골라야 한다.
16. **X** — many-to-many·join은 relational model이 더 잘 다룬다. document는 약하다.
17. **O** — schemaless라 불려도 application이 읽을 때 구조를 가정하므로 암묵적 schema(schema-on-read)가 있다.
18. **O** — 관계형은 JSON 지원을, document DB는 join 유사 기능을 추가하며 수렴 중이다.
19. **Query optimizer** — declarative 질의의 실행 계획(access path/인덱스 선택)을 자동 결정한다.
20. **Polyglot persistence** — 용도에 맞게 여러 종류의 데이터스토어를 함께 사용하는 접근.
