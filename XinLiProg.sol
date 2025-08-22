// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * npm i -D @openzeppelin/contracts@4.9.6
 */
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/* =========================================================
 *                     签到勋章 NFT，首枚tokenId = 1
 * =======================================================*/
contract SignBadgeNFT is ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); //只有它可铸币
    Counters.Counter private _ids;

    constructor(address admin, address minter) ERC721("PsyHelper Sign-in Badge", "PSYB") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
    }

    //
    function safeMint(address to, string memory tokenURI_) external onlyRole(MINTER_ROLE) returns (uint256) {
        _ids.increment();
        uint256 id = _ids.current();
        _safeMint(to, id);
        _setTokenURI(id, tokenURI_);
        return id;
    }

    function totalMinted() external view returns (uint256) {
        return _ids.current();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/* =========================================================
 *                   主合约：注册 + 签到发 NFT
 * =======================================================*/
contract PsyHelper is AccessControl {
    struct UserAttr {
        bool registered; 
        string profileCid; //病例Cid
        string chatCid; //聊天Cid
        uint256[] tokenIds;
        uint32 totalDays; //总天数
        uint32 streakDays; //连续天数
        uint64 lastDayIndex; // day index = timestamp / 1 days
    }

    enum RuleType { TOTAL, STREAK } //累计签到/连续签到
    struct Rule {
        RuleType rtype;
        uint32 threshold; //超过多少天发奖
        string tokenURI; //铸造什么币
        bool active; //是否启用
    }

    bytes32 public constant ADMIN = DEFAULT_ADMIN_ROLE;

    mapping(address => UserAttr) private users;
    SignBadgeNFT public immutable badge; //上面的 NFT 合约实例，immutable 表示部署后不可变更（更省 gas）

    Rule[] public rules;
    mapping(address => mapping(uint256 => bool)) public ruleMinted; //记录某用户是否已经领取过该规则的 NFT（防止重复发）。


    //这里测试用
    uint64 private _mockDay;
    //这里测试用



    event Registered(address indexed user);
    event ProfileUpdated(address indexed user, string profileCid, string chatCid);
    event CheckedIn(address indexed user, uint32 streakDays, uint32 totalDays, uint64 dayIndex);
    event RuleAdded(uint256 indexed ruleId, RuleType rtype, uint32 threshold, string tokenURI);
    event NftMinted(address indexed user, uint256 indexed ruleId, uint256 tokenId);

    //构造函数：部署时把部署者设为管理员；然后部署一个 NFT 合约，把本合约作为 MINTER_ROLE，这样 PsyHelper 就能直接铸造 NFT 给用户。
    constructor() {
        _grantRole(ADMIN, msg.sender);
        // 将当前合约设为 NFT 的 MINTER
        badge = new SignBadgeNFT(msg.sender, address(this));
    }


    //测试用
    function setMockDay(uint64 d) external onlyRole(ADMIN) { _mockDay = d; }
    //测试用
    
    //把当前时间戳换算成“第几天”的整数索引（UTC 基准，简单好用）。
    //注释掉的代码是原代码，现在的代码是用于天数测试
    //function _todayIndex() internal view returns (uint64) {
    //    return uint64(block.timestamp / 1 days);
    //}
    function _todayIndex() internal view returns (uint64) {
    if (_mockDay != 0) return _mockDay;
    return uint64(block.timestamp / 1 days);
}



    /* ---------------- 注册/读取/更新 ---------------- */

    function register() external {
        UserAttr storage u = users[msg.sender];
        require(!u.registered, "Already registered");
        u.registered   = true;
        u.profileCid   = "";
        u.chatCid      = "";
        u.streakDays   = 0;
        u.totalDays    = 0;
        u.lastDayIndex = 0;

        emit Registered(msg.sender);
    }

    //只读查询直接调取用户信息
    function getUser(address user) external view returns (
        bool registered,
        string memory profileCid,
        string memory chatCid,
        uint32 streakDays,
        uint32 totalDays,
        uint64 lastDayIndex,
        uint256 tokenCount
    ) {
        UserAttr storage u = users[user];
        return (
            u.registered,
            u.profileCid,
            u.chatCid,
            u.streakDays,
            u.totalDays,
            u.lastDayIndex,
            u.tokenIds.length
        );
    }

    function updateUser(string calldata profileCid, string calldata chatCid) external { //更新存储信息
        UserAttr storage u = users[msg.sender];
        //要求注册
        require(u.registered, "Not registered");
        u.profileCid  = profileCid;
        u.chatCid     = chatCid;
        emit ProfileUpdated(msg.sender, profileCid, chatCid);
    }

    //返回该用户所有已领的 tokenId 数组，方便前端展示“勋章墙”。
    function userTokens(address user) external view returns (uint256[] memory) {
        return users[user].tokenIds;
    }

    /* ---------------- 签到 & 发 NFT 规则 ---------------- */

    function addRule(RuleType rtype, uint32 thresholdDays, string calldata tokenURI) external onlyRole(ADMIN) returns (uint256) {
        rules.push(Rule({ rtype: rtype, threshold: thresholdDays, tokenURI: tokenURI, active: true }));
        uint256 id = rules.length - 1;
        emit RuleAdded(id, rtype, thresholdDays, tokenURI);
        return id;
    }

    function setRuleActive(uint256 ruleId, bool active) external onlyRole(ADMIN) {
        require(ruleId < rules.length, "bad rule");
        rules[ruleId].active = active;
    }

    function checkIn() external {
        UserAttr storage u = users[msg.sender];
        //已注册、防重复签到
        require(u.registered, "Not registered");

        uint64 today = _todayIndex();
        require(today > u.lastDayIndex, "Already checked in today");

        if (u.lastDayIndex == 0) {
            u.streakDays = 1;
            u.totalDays  = 1;
        } else if (today == u.lastDayIndex + 1) {
            u.streakDays += 1;
            u.totalDays  += 1;
        } else {
            u.streakDays = 1;
            u.totalDays  += 1;
        }
        u.lastDayIndex = today;

        emit CheckedIn(msg.sender, u.streakDays, u.totalDays, today);

        for (uint256 i = 0; i < rules.length; i++) {
            Rule storage r = rules[i];
            if (!r.active || ruleMinted[msg.sender][i]) continue; //规则被停用或该用户已领取过该规则的 NFT

            bool hit = (r.rtype == RuleType.TOTAL && u.totalDays >= r.threshold)
                    || (r.rtype == RuleType.STREAK && u.streakDays >= r.threshold);  //判断是否达标

            if (hit) {
                uint256 tokenId = badge.safeMint(msg.sender, r.tokenURI);
                users[msg.sender].tokenIds.push(tokenId);
                ruleMinted[msg.sender][i] = true;
                emit NftMinted(msg.sender, i, tokenId);
            }
        }
    }
}
