const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        // --- リアクティブステート ---
        const showMemberMenu = ref(false);
        const showExportModal = ref(false);
        const exportText = ref("");

        const defaultMembers = [
            { id: 1, name: 'Player A', rating: 10 },
            { id: 2, name: 'Player B', rating: 8 },
            { id: 3, name: 'Player C', rating: 12 },
            { id: 4, name: 'Player D', rating: 6 }
        ];

        const jplFormat = [
            { no: 1, name: '901', format: '3vs3', count: 3 },
            { no: 2, name: 'CR', format: '3vs3', count: 3 },
            { no: 3, name: '701', format: '2vs2', count: 2 },
            { no: 4, name: '501', format: '2vs2', count: 2 },
            { no: 5, name: '701', format: '1vs1', count: 1 },
            { no: 6, name: 'CR', format: '1vs1', count: 1 },
            { no: 7, name: '901', format: '3vs3', count: 3 },
            { no: 8, name: 'CR', format: '3vs3', count: 3 },
            { no: 9, name: 'CR', format: '2vs2', count: 2 },
            { no: 10, name: '501', format: '2vs2', count: 2 },
            { no: 11, name: '701', format: '1vs1', count: 1 },
            { no: 12, name: 'CR', format: '1vs1', count: 1 },
            { no: 13, name: '1101', format: '4vs4', count: 4 },
        ];

        const createTeam = (name = 'チーム1', members = defaultMembers, assignments = {}) => ({
            id: Date.now() + Math.floor(Math.random() * 100000),
            name,
            members: members.map(member => ({ ...member })),
            assignments: JSON.parse(JSON.stringify(assignments))
        });

        const teams = ref([]);
        const activeTeamId = ref(null);
        const currentTeam = computed(() => {
            return teams.value.find(team => team.id === activeTeamId.value) || teams.value[0] || null;
        });

        const members = computed({
            get: () => currentTeam.value?.members || [],
            set: (newMembers) => {
                if (currentTeam.value) currentTeam.value.members = newMembers;
            }
        });

        const assignments = computed({
            get: () => currentTeam.value?.assignments || {},
            set: (newAssignments) => {
                if (currentTeam.value) currentTeam.value.assignments = newAssignments;
            }
        });
        const selectedMember = ref(null);

        const newMemberName = ref("");
        const newMemberRating = ref(1);
        const newTeamName = ref("");

        onMounted(() => {
            try {
                const savedTeams = localStorage.getItem('jpl_teams');
                const savedActiveTeamId = localStorage.getItem('jpl_active_team_id');

                if (savedTeams) {
                    const parsedTeams = JSON.parse(savedTeams);
                    if (Array.isArray(parsedTeams) && parsedTeams.length > 0) {
                        teams.value = parsedTeams;
                    }
                }

                if (teams.value.length === 0) {
                    // 旧データ形式（単一チーム）からの移行
                    const savedAssignments = localStorage.getItem('jpl_assignments');
                    const savedMembers = localStorage.getItem('jpl_members');
                    const legacyMembers = savedMembers ? JSON.parse(savedMembers) : defaultMembers;
                    const legacyAssignments = savedAssignments ? JSON.parse(savedAssignments) : {};
                    teams.value = [createTeam('チーム1', legacyMembers, legacyAssignments)];
                }

                if (savedActiveTeamId) {
                    const parsedId = Number(savedActiveTeamId);
                    const exists = teams.value.some(team => team.id === parsedId);
                    activeTeamId.value = exists ? parsedId : teams.value[0].id;
                } else {
                    activeTeamId.value = teams.value[0].id;
                }
            } catch (e) { console.error(e); }
        });

        watch(teams, (newVal) => {
            localStorage.setItem('jpl_teams', JSON.stringify(newVal));
        }, { deep: true });

        watch(activeTeamId, (newVal) => {
            if (newVal != null) localStorage.setItem('jpl_active_team_id', String(newVal));
        });

        // --- メソッド ---
        const openMenu = () => { showMemberMenu.value = true; };
        const closeMenu = () => { showMemberMenu.value = false; };
        const closeExportModal = () => { showExportModal.value = false; };

        const switchTeam = (teamId) => {
            activeTeamId.value = teamId;
            selectedMember.value = null;
        };

        const addTeam = () => {
            const name = newTeamName.value.trim() || `チーム${teams.value.length + 1}`;
            const team = createTeam(name, defaultMembers, {});
            teams.value.push(team);
            activeTeamId.value = team.id;
            selectedMember.value = null;
            newTeamName.value = "";
        };

        const deleteTeam = (teamId) => {
            if (teams.value.length <= 1) {
                alert("最低1チームは必要です。");
                return;
            }
            const team = teams.value.find(t => t.id === teamId);
            if (!team) return;
            if (!confirm(`「${team.name}」を削除しますか？`)) return;

            teams.value = teams.value.filter(t => t.id !== teamId);
            if (activeTeamId.value === teamId) {
                activeTeamId.value = teams.value[0].id;
                selectedMember.value = null;
            }
        };

        const getPlayCount = (memberId) => {
            let count = 0;
            Object.values(assignments.value).forEach(slots => {
                Object.values(slots).forEach(id => {
                    if (id === memberId) count++;
                });
            });
            return count;
        };

        // 特定のゲーム番号までの出場数を計算
        const getPlayCountUpTo = (memberId, currentGameNo) => {
            let count = 0;
            Object.keys(assignments.value).forEach(gameKey => {
                const gNo = Number(gameKey);
                // 現在のゲーム番号以下（過去〜現在）のみカウント
                if (gNo <= currentGameNo) {
                    const slots = assignments.value[gameKey];
                    Object.values(slots).forEach(id => {
                        if (id === memberId) count++;
                    });
                }
            });
            return count;
        };

        const selectMember = (member) => {
            if (selectedMember.value?.id === member.id) {
                selectedMember.value = null;
            } else {
                selectedMember.value = member;
            }
        };

        const assignMember = (gameNo, slotIndex) => {
            if (!assignments.value[gameNo]) {
                assignments.value[gameNo] = {};
            }
            const currentId = assignments.value[gameNo][slotIndex];

            if (selectedMember.value) {
                if (currentId === selectedMember.value.id) return;

                const gameSlots = assignments.value[gameNo];
                const isAlreadyInGame = Object.values(gameSlots).includes(selectedMember.value.id);

                if (isAlreadyInGame) {
                    alert(`${selectedMember.value.name}はすでに出場しています。`);
                    return;
                }

                const currentCount = getPlayCount(selectedMember.value.id);
                if (currentCount >= 7) {
                    alert("出場可能数は７ゲームまでです。");
                    return;
                }

                assignments.value[gameNo][slotIndex] = selectedMember.value.id;
            } else {
                if (currentId) {
                    delete assignments.value[gameNo][slotIndex];
                }
            }
        };

        const getAssignedMemberObj = (gameNo, slotIndex) => {
            const memberId = assignments.value[gameNo]?.[slotIndex];
            if (!memberId) return null;
            return members.value.find(m => m.id === memberId);
        };

        const getGameTotalRating = (gameNo) => {
            const slots = assignments.value[gameNo];
            if (!slots) return 0;
            let total = 0;
            Object.values(slots).forEach(memberId => {
                const member = members.value.find(m => m.id === memberId);
                if (member) total += (Number(member.rating) || 0);
            });
            return total;
        };

        const addMember = () => {
            if (!newMemberName.value.trim()) return;
            const newId = Date.now();
            const rating = Number(newMemberRating.value) || 1;
            members.value.push({ id: newId, name: newMemberName.value, rating: rating });
            newMemberName.value = "";
            newMemberRating.value = 1;
        };

        const deleteMember = (memberId) => {
            const member = members.value.find(m => m.id === memberId);
            if (!member) return;
            if (confirm(`「${member.name}」を削除しますか？`)) {
                members.value = members.value.filter(m => m.id !== memberId);
                Object.keys(assignments.value).forEach(gameNo => {
                    const slots = assignments.value[gameNo];
                    Object.keys(slots).forEach(slotIndex => {
                        if (slots[slotIndex] === memberId) {
                            delete slots[slotIndex];
                        }
                    });
                });
                if (selectedMember.value?.id === memberId) {
                    selectedMember.value = null;
                }
            }
        };

        const resetData = () => {
            if (confirm("現在のオーダー表を全てクリアしますか？")) {
                assignments.value = {};
            }
        };

        const generateExportText = () => {
            let text = "オーダー\n";
            jplFormat.forEach(game => {
                const slots = assignments.value[game.no] || {};
                const assignedMembers = [];
                // スロット順（1, 2...）にメンバー名を取得
                // game.count 分だけループして順序を保証する
                for (let i = 0; i < game.count; i++) {
                    const memberId = slots[i];
                    const member = members.value.find(m => m.id === memberId);
                    if (member) {
                        assignedMembers.push(member.name);
                    }
                }
                const membersStr = assignedMembers.length > 0 ? assignedMembers.join(', ') : '';
                text += `G${game.no}: ${game.name}【${membersStr}】\n`;
            });

            text += "\n出場数\n";
            members.value.forEach(member => {
                const count = getPlayCount(member.id);
                if (count > 0) {
                    text += `${member.name}: ${count}\n`;
                }
            });

            return text;
        };

        const openExportModal = () => {
            exportText.value = generateExportText();
            showExportModal.value = true;
        };

        const copyToClipboard = async () => {
            try {
                await navigator.clipboard.writeText(exportText.value);
                alert("クリップボードにコピーしました！");
            } catch (err) {
                console.error('Copy failed', err);
                alert("コピーに失敗しました。");
            }
        };

        return {
            games: jplFormat,
            teams,
            activeTeamId,
            currentTeam,
            members,
            selectedMember,
            newMemberName,
            newMemberRating,
            newTeamName,
            showMemberMenu,
            openMenu,
            closeMenu,
            switchTeam,
            addTeam,
            deleteTeam,
            selectMember,
            assignMember,
            getAssignedMemberObj,
            getGameTotalRating,
            getPlayCount,
            getPlayCountUpTo,
            addMember,
            deleteMember,
            resetData,
            showExportModal,
            exportText,
            openExportModal,
            closeExportModal,
            copyToClipboard
        };
    }
}).mount('#app');
