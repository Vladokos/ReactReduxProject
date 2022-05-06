import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DragDropContext, Droppable } from "react-beautiful-dnd";

import { useSelector, useDispatch } from "react-redux";
import {
  changeLists,
  changeData,
  getBoards,
} from "../../features/boards/boardsSlice";
import {
  getLists,
  getList,
  sortingLists,
  changeCards,
  removeList,
  moveCard,
} from "../../features/lists/listsSlice";
import { getCards, getCard, removeCard } from "../../features/card/cardsSlice";

import useWindowHeight from "../../hooks/heightWindowHook";

import { Loader } from "../blanks/Loader";
import { Header } from "../blanks/Header";
import { CreateBoards } from "../CreateBoards";
import { BoardName } from "./BoardName";
import { List } from "./List";
import { CreateList } from "./CreateList";
import { ChangeCard } from "./ChangeCard";
import { ChangeNameCard } from "./ChangeNameCard";
import { Menu } from "./Menu";

import "../../styles/Board/Board.css";

export const Board = ({ socket }) => {
  const navigate = useNavigate();
  const params = useParams();

  const { height } = useWindowHeight();

  const dispatch = useDispatch();
  const { boards } = useSelector((state) => state.boards);
  const { lists } = useSelector((state) => state.lists);
  const { cards, status } = useSelector((state) => state.cards);

  const [firstUpdate, setFirstUpdate] = useState(0);

  const [createShow, setCreateShow] = useState(false);

  const [changeCard, setChangeCard] = useState(false);
  const [changeNameCard, setChangeNameCard] = useState(false);

  const [nameCard, setNameCard] = useState("");
  const [descriptionCard, setDescriptionCard] = useState("");

  const [listId, setListId] = useState(null);
  const [cardId, setCardId] = useState(null);

  const [xPos, setXPos] = useState(null);
  const [yPos, setYPos] = useState(null);

  const [connect, setConnect] = useState(false);

  const visibleChangeCard = (e, id, description) => {
    if (e.target.innerText === "") return null;
    setCardId(id);

    setNameCard(e.target.innerText);
    setDescriptionCard(description);

    setChangeCard(true);
  };

  const visibleChangeNameCard = (e, nameCard, id) => {
    setNameCard(nameCard);

    setCardId(id);

    setXPos(e.target.getBoundingClientRect().x);
    setYPos(e.target.getBoundingClientRect().y);

    setChangeNameCard(true);
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) navigate("/sig");

    socket.emit("tokenVerify", JSON.parse(accessToken));

    socket.on("tokenVerify", (data) => {
      if (data !== "Error") {
        const { newToken, idUser, userName } = data;

        const userId = localStorage.getItem("userId");

        const { boardId } = params;

        if (newToken) localStorage.setItem("accessToken", newToken);

        localStorage.setItem("userId", idUser);
        localStorage.setItem("userName", userName);

        const date = Date.now();
        dispatch(changeData({ boardId, date }));

        dispatch(getLists(boardId));

        dispatch(getBoards(userId));

        dispatch(getCards(boardId));

        setFirstUpdate(0);

        socket.off("tokenVerify");
      } else {
        navigate("/error/404");
      }
    });
  }, [params]);

  useEffect(() => {
    socket.on("bond", (data) => {
      const { message, position } = data;
      const { listId, currentListId } = data;
      const { cardId, fromListId, toListId } = data;

      const userId = localStorage.getItem("userId");

      const { boardId } = params;

      switch (message) {
        case "Update lists":
          dispatch(getBoards(userId));

          dispatch(getLists(boardId));

          break;
        case "Update list":
          dispatch(getList(listId));

          break;
        case "Delete list":
          dispatch(removeList(listId));
          break;

        case "Move list":
          dispatch(changeLists({ position, boardId, currentListId }));
          break;

        case "Update cards":
          dispatch(getLists(boardId));

          dispatch(getCards(boardId));

          break;

        case "Update card":
          dispatch(getCard(cardId));

          break;

        case "Delete card":
          dispatch(removeCard({ cardId }));

          break;

        case "Move card":
          dispatch(getList(fromListId));
          dispatch(getList(toListId));

          break;

        default:
          break;
      }
    });
  }, [socket]);

  const onDrop = (e) => {
    if (e.type === "list") {
      const position = e.destination.index;
      const { boardId } = params;
      const currentListId = e.draggableId;

      dispatch(changeLists({ position, boardId, currentListId }));

      socket.emit("bond", {
        roomId: boardId,
        message: "list moved",
        position,
        currentListId,
      });
    } else if (e.type === "card") {
      const { boardId } = params;

      const fromListId = e.source.droppableId;
      const toListId = e.destination.droppableId;
      const position = e.destination.index;
      const cardId = e.draggableId;

      dispatch(changeCards({ fromListId, toListId, position, cardId }));

      socket.emit("bond", {
        roomId: boardId,
        message: "card moved",
        cardId,
        fromListId,
        toListId,
        position,
      });
    }
  };

  useEffect(() => {
    if (boards.length > 0 && lists.length > 0) {
      boards.map((board) => {
        if (board._id === params.boardId && board.shareLink && !connect) {
          const roomId = params.boardId;
          socket.emit("room", roomId);

          setConnect(true);
        }
      });
      dispatch(sortingLists(boards));
    }
  }, [boards]);

  useLayoutEffect(() => {
    if (firstUpdate < 2) {
      setFirstUpdate(firstUpdate + 1);
      return;
    }
    const boardId = boards[boards.length - 1]._id;
    const boardName = boards[boards.length - 1].nameBoard;
    setFirstUpdate(0);
    // navigate("/board/" + boardId + "/" + boardName);
  }, [boards]);

  const [drag, setDrag] = useState(false);

  return status !== "succeeded" ? (
    <Loader />
  ) : (
    <div className="boardMenu" style={{ height: height }}>
      <Header boards={boards} createShow={() => setCreateShow(true)} />
      <div className="lists" style={{ height: height - 127 }}>
        <div className="container">
          <div className="lists__inner" style={{ height: height - 200 }}>
            {boards.map((board) => {
              if (board._id === params.boardId) {
                return (
                  <div key={board._id} className="action-board">
                    <BoardName name={board.nameBoard} />
                    <Menu
                      height={height - 108}
                      boards={boards}
                      lists={lists}
                      cards={cards}
                      socket={socket}
                      shareLink={board.shareLink}
                    />
                  </div>
                );
              }
            })}

            <ul
              className="scrollBoard"
              style={drag === false ? { transform: `translateZ(10px)` } : null}
            >
              <DragDropContext
                onDragStart={() => setDrag(true)}
                onDragEnd={(e) => {
                  onDrop(e);
                  setDrag(false);
                }}
              >
                <Droppable
                  droppableId="lists"
                  direction="horizontal"
                  type="list"
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="sheetList"
                    >
                      {lists.map((list, index) =>
                        !list.archived ? (
                          <List
                            key={listId + index}
                            boards={boards}
                            listId={list._id}
                            listName={list.nameList}
                            listCards={list.cards}
                            index={index}
                            cards={cards}
                            visibleChangeCard={visibleChangeCard}
                            visibleChangeNameCard={visibleChangeNameCard}
                            height={height - 307}
                            socket={socket}
                          />
                        ) : null
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <CreateList socket={socket} />
            </ul>
            <ChangeCard
              nameCard={nameCard}
              descriptionCard={descriptionCard}
              changeDescription={(e) => setDescriptionCard(e.target.value)}
              cardId={cardId}
              changeCard={(e) => setNameCard(e.target.value)}
              isOpen={changeCard}
              closeForm={() => setChangeCard(false)}
              socket={socket}
            />

            {changeNameCard === false ? null : (
              <ChangeNameCard
                nameCard={nameCard}
                changeNameCard={(e) => setNameCard(e.target.value)}
                cardId={cardId}
                closeForm={() => setChangeNameCard(false)}
                xPos={xPos}
                yPos={yPos}
                height={height - 270}
                socket={socket}
              />
            )}
          </div>
        </div>
      </div>
      <CreateBoards
        createShow={createShow}
        changeShow={() => setCreateShow(false)}
        height={height}
      />
    </div>
  );
};
